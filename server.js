require("dotenv").config();

const express = require("express");
const cors = require("cors");
const Stripe = require("stripe");

const { Resend } = require("resend");
const resend = new Resend(process.env.RESEND_API_KEY);

const app = express();

// 🔥 IMPORTANT : webhook AVANT json
app.use("/stripe-webhook", express.raw({ type: "application/json" }));

app.use(cors());
app.use(express.json());

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// 🔑 Générateur
function generateKey() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const part = () =>
    Array.from({ length: 4 }, () =>
      chars[Math.floor(Math.random() * chars.length)]
    ).join("");
  return `IA-${part()}-${part()}`;
}

// 🧪 TEST
app.get("/generate-license", (req, res) => {
  const key = generateKey();
  console.log("🧪 TEST GET →", key);
  res.json({ license: key });
});

// 💳 WEBHOOK STRIPE
app.post("/stripe-webhook", async (req, res) => {
  const sig = req.headers["stripe-signature"];

  let event;

  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error("❌ Signature invalide");
    return res.sendStatus(400);
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object;

    const email =
      session.customer_details?.email ||
      session.customer_email ||
      "NO_EMAIL";

    const license = generateKey();

    console.log("💰 Paiement validé !");
    console.log("📧 Email :", email);
    console.log("🔑 Licence :", license);

    try {
      await resend.emails.send({
        from: "IAssistant <noreply@iassistant-studio.com>",
        to: email,
        subject: "🎉 Votre licence IAssistant",
        html: `
          <h1>Merci pour votre achat 🚀</h1>
          
          <p>Voici votre licence :</p>
          <h2>${license}</h2>

          <p>Télécharger IAssistant :</p>
          <a href="${process.env.DOWNLOAD_URL}">Télécharger</a>
        `
      });
      console.log("📧 Email envoyé !");
    } catch (err) {
      console.error("❌ Erreur envoi email :", err);
    }
  }

  res.json({ received: true });
});

// SUCCESS
app.get("/success", (req, res) => {
  const license = generateKey();

  res.send(`
    <h1>Merci pour votre achat 🎉</h1>
    <p>Votre licence :</p>
    <h2>${license}</h2>

    <p>Télécharger IAssistant :</p>
    <a href="${process.env.DOWNLOAD_URL}">Télécharger</a>
  `);
});

// SERVER
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log("🚀 Server running on port " + PORT);
});