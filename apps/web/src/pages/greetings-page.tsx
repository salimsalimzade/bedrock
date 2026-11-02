import type { Greeting } from "@bedrock/types";
import { createSignal, Show } from "solid-js";
import { Button, TextField, toast } from "yosegi-solid";
import { fetchGreeting, getErrorMessage } from "../lib/api-client";
import styles from "./page.module.css";

export default function GreetingsPage() {
  const [name, setName] = createSignal("");
  const [greeting, setGreeting] = createSignal<Greeting>();
  const [submitting, setSubmitting] = createSignal(false);

  // Mutation-style call from an event handler: writes happen here, not in a computation.
  const submit = async (event: SubmitEvent) => {
    event.preventDefault();
    setSubmitting(true);

    try {
      setGreeting(await fetchGreeting(name()));
    } catch (error) {
      toast.error("Couldn't send the greeting", { description: getErrorMessage(error) });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section class={styles.page}>
      <h1 class={styles["page-title"]}>Greetings</h1>
      <p class={styles["page-description"]}>
        Sends <code>GET /api/greetings/:name</code> through the typed Hono client.
      </p>

      <form class={styles["page-form"]} onSubmit={submit}>
        <TextField label="Your name" placeholder="Ada Lovelace" value={name()} onChange={setName} />
        <Button type="submit" label="Say hello" loading={submitting()} disabled={!name().trim()} />
      </form>

      <Show when={greeting()}>
        {(current) => <p class={styles["greeting-message"]}>{current().message}</p>}
      </Show>
    </section>
  );
}
