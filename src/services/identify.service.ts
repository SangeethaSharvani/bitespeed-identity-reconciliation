import { prisma } from "../prisma/client";

interface IdentifyInput {
  email?: string;
  phoneNumber?: string;
}

export class IdentifyService {
  static async identify(data: IdentifyInput) {
    const { email, phoneNumber } = data;

    if (!email && !phoneNumber) {
      throw new Error("At least one of email or phoneNumber is required");
    }

    return prisma.$transaction(async (tx) => {
      // 1️⃣ Find all contacts matching email OR phone
      const matchingContacts = await tx.contact.findMany({
        where: {
          OR: [
            email ? { email } : undefined,
            phoneNumber ? { phoneNumber } : undefined,
          ].filter(Boolean) as any,
        },
        orderBy: { createdAt: "asc" },
      });

      // 2️⃣ If no matches → create new primary
      if (matchingContacts.length === 0) {
        const newContact = await tx.contact.create({
          data: {
            email,
            phoneNumber,
            linkPrecedence: "primary",
          },
        });

        return {
          primaryContactId: newContact.id,
          emails: email ? [email] : [],
          phoneNumbers: phoneNumber ? [phoneNumber] : [],
          secondaryContactIds: [],
        };
      }

      // 3️⃣ Collect all primary IDs from matching contacts
      const primaryIds = matchingContacts.map((contact) =>
        contact.linkPrecedence === "primary"
          ? contact.id
          : contact.linkedId!
      );

      // Remove duplicates
      const uniquePrimaryIds = [...new Set(primaryIds)];

      const primaryContacts = await tx.contact.findMany({
        where: { id: { in: uniquePrimaryIds } },
        orderBy: { createdAt: "asc" },
      });

      // 4️⃣ Oldest primary becomes master
      const oldestPrimary = primaryContacts[0];

      // 5️⃣ Merge newer primaries into oldest
      for (let primary of primaryContacts.slice(1)) {
        // Convert primary to secondary
        await tx.contact.update({
          where: { id: primary.id },
          data: {
            linkPrecedence: "secondary",
            linkedId: oldestPrimary.id,
          },
        });

        // Re-link its secondaries to oldest primary
        await tx.contact.updateMany({
          where: { linkedId: primary.id },
          data: {
            linkedId: oldestPrimary.id,
          },
        });
      }

      // 6️⃣ Fetch full identity cluster
      const fullCluster = await tx.contact.findMany({
        where: {
          OR: [
            { id: oldestPrimary.id },
            { linkedId: oldestPrimary.id },
          ],
        },
        orderBy: { createdAt: "asc" },
      });

      const emailExists = email
        ? fullCluster.some((c) => c.email === email)
        : true;

      const phoneExists = phoneNumber
        ? fullCluster.some((c) => c.phoneNumber === phoneNumber)
        : true;

      // 7️⃣ If new information → create secondary
      if (!emailExists || !phoneExists) {
        await tx.contact.create({
          data: {
            email,
            phoneNumber,
            linkPrecedence: "secondary",
            linkedId: oldestPrimary.id,
          },
        });
      }

      // 8️⃣ Fetch updated cluster
      const updatedCluster = await tx.contact.findMany({
        where: {
          OR: [
            { id: oldestPrimary.id },
            { linkedId: oldestPrimary.id },
          ],
        },
        orderBy: { createdAt: "asc" },
      });

      return {
        primaryContactId: oldestPrimary.id,
        emails: [
          ...new Set(
            updatedCluster
              .map((c) => c.email)
              .filter((email): email is string => Boolean(email))
          ),
        ],
        phoneNumbers: [
          ...new Set(
            updatedCluster
              .map((c) => c.phoneNumber)
              .filter((phone): phone is string => Boolean(phone))
          ),
        ],
        secondaryContactIds: updatedCluster
          .filter((c) => c.linkPrecedence === "secondary")
          .map((c) => c.id),
      };
    });
  }
}