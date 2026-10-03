"use client";

import { FormEvent, useState } from "react";
import { Camera, ExternalLink, MapPin, MessageCircle, Phone, Send } from "lucide-react";
import { StoreHeader } from "@/app/store-header";
import {useStore} from "@/app/store-provider";
import { StoreFooter } from "@/app/store-footer";

export default function ContactPage() {
  const {settings}=useStore();
  const [sent, setSent] = useState(false);

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const message = [
      "Hello KATHA Ethnic Wear,",
      "",
      `Name: ${form.get("name")}`,
      `Subject: ${form.get("subject")}`,
      `Phone: ${form.get("phone")}`,
      `Email: ${form.get("email") || "Not provided"}`,
      "",
      `Message: ${form.get("message")}`,
    ].join("\n");
    window.open(`https://wa.me/${settings.whatsapp}?text=${encodeURIComponent(message)}`, "_blank", "noopener,noreferrer");
    setSent(true);
  };

  return (
    <main className="contact-page">
      <StoreHeader />
      <section className="contact-hero">
        <p className="eyebrow">We are here to help</p>
        <h1>Get in touch.</h1>
        <p>Ask about styles, sizing, availability or your order. Our store team will reply on WhatsApp.</p>
      </section>

      <section className="contact-layout">
        <div className="contact-form-card">
          <p className="eyebrow">Write us a message</p>
          <h2>How can we help?</h2>
          <form className="contact-form" onSubmit={submit}>
            <label>Your name <span>*</span><input name="name" autoComplete="name" required /></label>
            <label>Subject <span>*</span><input name="subject" required /></label>
            <label>Your email <small>Optional</small><input type="email" name="email" autoComplete="email" /></label>
            <label>Your phone <span>*</span><input type="tel" name="phone" autoComplete="tel" inputMode="tel" required /></label>
            <label className="contact-message">Your message <span>*</span><textarea name="message" rows={7} required /></label>
            <button type="submit">Send on WhatsApp <MessageCircle /></button>
            {sent && <p className="contact-success" role="status">Your message is ready in WhatsApp. Tap send there to contact KATHA.</p>}
          </form>
        </div>

        <aside className="contact-details" aria-label="KATHA contact details">
          <article><Phone /><div><small>Call us now</small><a href={"tel:"+settings.phone}>{settings.phone}</a></div></article>
          <article><MessageCircle /><div><small>WhatsApp</small><a href={"https://wa.me/"+settings.whatsapp} target="_blank" rel="noreferrer">Chat with our store team <ExternalLink /></a></div></article>
          <article><MapPin /><div><small>Our address</small><strong>{settings.storeName}</strong><address>{settings.address}</address><p>{settings.timings}</p><a href={settings.mapsUrl} target="_blank" rel="noreferrer">Open Google Maps <Send /></a></div></article>
          <article><Camera /><div><small>Instagram</small><a href={settings.instagramUrl} target="_blank" rel="noreferrer">Instagram <ExternalLink /></a></div></article>
        </aside>
      </section>
      <StoreFooter />
    </main>
  );
}
