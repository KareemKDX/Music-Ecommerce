export function accountLogout() {
  localStorage.removeItem("token");
  window.location.href = "/";
}
