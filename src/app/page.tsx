import { redirect } from "next/navigation";

/** The app opens on the dashboards listing. */
export default function Home() {
  redirect("/dashboards");
}
