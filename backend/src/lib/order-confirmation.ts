// The order confirmation's content – the shop's own code, Resend doesn't know about orders.

export type Order = {
  id: number;
  name: string;
  email: string;
  items: { title: string; quantity: number; price: number }[]; // price in SEK per item
  shipping: number; // shipping price in SEK
};

// Escampe html function so that DB information cannot be read through HTML.

export function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

// Change to .00 digits for a nicer look
function kr(amount: number) {
  return `${amount.toFixed(2)} kr`;
}

export function orderConfirmation(order: Order) {
  const itemsTotal = order.items.reduce(
    (sum, item) => sum + item.quantity * item.price,
    0,
  );
  const total = itemsTotal + order.shipping;

  // The order number in the subject
  const subject = `Order confirmation #${order.id} – Spexah Instruments`;

  // HTML: every value from the user/database goes through escapeHtml()
  const rows = order.items
    .map(
      (item) => `
        <tr>
          <td>${escapeHtml(item.title)}</td>
          <td style="text-align:center">${item.quantity}</td>
          <td style="text-align:right">${kr(item.price)}</td>
          <td style="text-align:right">${kr(item.quantity * item.price)}</td>
        </tr>`,
    )
    .join("");

  const html = `
    <h1>Thank you for your order, ${escapeHtml(order.name)}!</h1>
    <p>Order number: <strong>#${order.id}</strong></p>
    <table cellpadding="6" style="border-collapse:collapse">
      <thead>
        <tr>
          <th style="text-align:left">Product</th>
          <th>Quantity</th>
          <th style="text-align:right">Price</th>
          <th style="text-align:right">Sum</th>
        </tr>
      </thead>
      <tbody>${rows}
        <tr>
          <td colspan="3">Shipping</td>
          <td style="text-align:right">${kr(order.shipping)}</td>
        </tr>
        <tr>
          <td colspan="3"><strong>Total</strong></td>
          <td style="text-align:right"><strong>${kr(total)}</strong></td>
        </tr>
      </tbody>
    </table>
    <p>We will get back to you when the order is on it's way!</p>
    <p>Spexah Instruments</p>`;

  // The same content without HTML – for e-mail programs that don't show HTML, and for spam filters
  const lines = order.items.map(
    (item) =>
      `- ${item.title}, ${item.quantity} x ${kr(item.price)} = ${kr(item.quantity * item.price)}`,
  );
  const text = [
    `Thank you for your order, ${order.name}!`,
    "",
    `Order number: #${order.id}`,
    "",
    ...lines,
    `Shipping: ${kr(order.shipping)}`,
    `Total: ${kr(total)}`,
    "",
    `We will let you know at ${order.email} when your order is on its way.`,
    "Spexah Instruments",
  ].join("\n");

  return { subject, html, text };
}
