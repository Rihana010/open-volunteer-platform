"use client";

export function AdminLogoutButton() {
  async function handleLogout() {
    localStorage.removeItem("adminEmail");

    await fetch("/api/admin/logout", {
      method: "POST",
      credentials: "same-origin",
      redirect: "follow",
    });

    window.location.href = "/";
  }

  return (
    <button
      type="button"
      onClick={handleLogout}
      className="rounded-xl bg-blue-600 px-4 py-2 font-semibold text-white transition hover:bg-[var(--ovp-blue-dark)]"
    >
      Sign Out
    </button>
  );
}