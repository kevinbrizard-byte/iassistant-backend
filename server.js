const express = require("express");
const cors = require("cors");
const Stripe = require("stripe");

const app = express();
app.use(cors());
app.use(express.json());

function generateKey() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const part = () =>
    Array.from({ length: 4 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
  return `IA-${part()}-${part()}`;
}

// 🔥 TEST GET
app.get("/generate-license", (req, res) => {
  const key = generateKey();
  console.log("🧪 TEST GET →", key);
  res.json({ license: key });
});

// 🔥 POST
app.post("/generate-license", (req, res) => {
  const key = generateKey();
  console.log("⚙️ POST →", key);
  res.json({ license: key });
});

// 🔥 WEBHOOK STRIPE (temp)
const Stripe = require("stripe");
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// ⚠️ IMPORTANT (à mettre en haut du fichier)
app.use("/stripe-webhook", express.raw({ type: "application/json" }));

app.post("/stripe-webhook", (req, res) => {
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
  }

  res.json({ received: true });
});

// 🔥 SUCCESS PAGE
app.get("/success", (req, res) => {
  const license = generateKey();

  res.send(`
    <h1>Merci pour votre achat 🎉</h1>
    <p>Votre licence :</p>
    <h2>${license}</h2>

    <p>Télécharger IAssistant :</p>
    <a href="https://drive.google.com/uc?export=download&id=1_CrTlYwoWQkT81_maNJhwUJELvGAqgNY">Télécharger</a>
  `);
});

// 🔥 SERVER (Railway OK)
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log("🚀 Server running on port " + PORT);
});