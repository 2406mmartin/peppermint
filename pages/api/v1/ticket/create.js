const { prisma } = require("../../../../prisma/prisma");
import { sendTicketCreate } from "../../../../lib/nodemailer/ticket/create";

export default async function createTicket(req, res) {
  const { name, company, detail, title, priority, email, engineer, issue } = req.body;

  try {
    await prisma.ticket
      .create({
        data: {
          name,
          title,
          detail,
          priority: priority ? priority : 'low',
          issue,
          email,
          client: company ? {
            connect: { id: Number(company.id) },
          } : undefined,
          assignedTo: engineer ? {
            connect: { id: Number(engineer.id) },
          } : undefined,
          isComplete: Boolean(false),

        },
      })
      .then((ticket) => {
        sendTicketCreate(ticket);
      });

    const webhook = await prisma.webhooks.findMany({
      where: {
        type: "ticket_created",
      },
    });

    for (let i = 0; i < webhook.length; i++) {
      if (webhook[i].active === true) {
        console.log(webhook[i].url);
        await fetch(`${webhook[i].url}`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            data: `Ticket ${data.id} created by ${data.name} -> ${data.email}. Priority -> ${data.priority}`,
          }),
          redirect: "follow",
        });
      }
    }

    res.status(200).json({ message: "Ticket created correctly" });
  } catch (error) {
    console.log(error);
    res.status(500).json({ error });
  }
}
