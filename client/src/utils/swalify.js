import Swal from "sweetalert2";
import "sweetalert2/dist/sweetalert2.min.css";

/*
 * Style neo-brutalism disuntik sekali saja lewat <style>,
 * bukan lewat class Tailwind dinamis, karena Tailwind
 * hanya membaca class yang tertulis literal di source.
 */
const STYLE_ID = "doodly-swal-style";

function injectStyle() {
  if (typeof document === "undefined") return;
  if (document.getElementById(STYLE_ID)) return;

  const style = document.createElement("style");
  style.id = STYLE_ID;

  style.textContent = `
    .doodly-swal-popup {
      background: #FFFFFF;
      border: 3px solid #000000;
      border-radius: 0;
      box-shadow: 8px 8px 0px 0px #000000;
      font-family: inherit;
      color: #000000;
      padding: 2rem 1.75rem;
    }

    .doodly-swal-title {
      font-weight: 900;
      font-size: 1.5rem;
      line-height: 1.15;
      text-transform: uppercase;
      letter-spacing: -0.02em;
      color: #000000;
      padding: 0;
      margin-bottom: 0.5rem;
    }

    .doodly-swal-text {
      font-weight: 600;
      font-size: 0.875rem;
      color: #374151;
      margin: 0;
    }

    .doodly-swal-icon {
      border: 3px solid #000000;
      border-radius: 0;
      color: #000000;
      font-weight: 900;
      font-size: 1.75rem;
      width: 3.5rem;
      height: 3.5rem;
      margin: 0 auto 1.25rem auto;
      box-shadow: 3px 3px 0px 0px #000000;
    }

    .doodly-swal-icon .swal2-icon-content {
      font-weight: 900;
      color: #000000;
    }

    .doodly-swal-icon-warning  { background: #FFE600; }
    .doodly-swal-icon-danger   { background: #F87171; }
    .doodly-swal-icon-success  { background: #00FF55; }
    .doodly-swal-icon-error    { background: #F87171; }
    .doodly-swal-icon-info     { background: #4B9EFF; }

    .doodly-swal-actions {
      gap: 0.75rem;
      margin-top: 1.5rem;
      width: 100%;
    }

    .doodly-swal-btn {
      border: 3px solid #000000;
      border-radius: 0;
      padding: 0.7rem 1.5rem;
      font-weight: 900;
      font-size: 0.8rem;
      text-transform: uppercase;
      color: #000000;
      box-shadow: 4px 4px 0px 0px #000000;
      transition: all 0.15s ease;
      cursor: pointer;
      outline: none;
    }

    .doodly-swal-btn:focus { outline: none; box-shadow: 4px 4px 0px 0px #000000; }

    .doodly-swal-btn:active {
      transform: translate(4px, 4px);
      box-shadow: none;
    }

    .doodly-swal-confirm          { background: #EB4B98; }
    .doodly-swal-confirm:hover    { background: #FFE600; }

    .doodly-swal-confirm-danger       { background: #F87171; }
    .doodly-swal-confirm-danger:hover { background: #EF4444; }

    .doodly-swal-cancel        { background: #E2E8F0; }
    .doodly-swal-cancel:hover  { background: #CBD5E1; }

    .doodly-swal-backdrop { background: rgba(0, 0, 0, 0.6); }
  `;

  document.head.appendChild(style);
}

injectStyle();

const BaseSwal = Swal.mixin({
  buttonsStyling: false,
  reverseButtons: true,
  focusConfirm: false,
  backdrop: true,

  showClass: { popup: "" },
  hideClass: { popup: "" },

  customClass: {
    popup: "doodly-swal-popup",
    title: "doodly-swal-title",
    htmlContainer: "doodly-swal-text",
    actions: "doodly-swal-actions",
    confirmButton: "doodly-swal-btn doodly-swal-confirm",
    cancelButton: "doodly-swal-btn doodly-swal-cancel",
    container: "doodly-swal-backdrop",
  },
});

export const showAlert = {
  /**
   * Dialog konfirmasi ya/tidak.
   * Pengganti window.confirm, tapi harus di-await.
   *
   * @returns {Promise<boolean>}
   */
  confirm: async ({
    title,
    text = "",
    confirmText = "Ya, lanjutkan",
    cancelText = "Batal",
    danger = false,
  }) => {
    injectStyle();

    const result = await BaseSwal.fire({
      title,
      text,
      iconHtml: danger ? "!" : "?",
      showCancelButton: true,
      confirmButtonText: confirmText,
      cancelButtonText: cancelText,

      customClass: {
        popup: "doodly-swal-popup",
        title: "doodly-swal-title",
        htmlContainer: "doodly-swal-text",
        actions: "doodly-swal-actions",
        cancelButton: "doodly-swal-btn doodly-swal-cancel",
        container: "doodly-swal-backdrop",

        icon: danger
          ? "doodly-swal-icon doodly-swal-icon-danger"
          : "doodly-swal-icon doodly-swal-icon-warning",

        confirmButton: danger
          ? "doodly-swal-btn doodly-swal-confirm-danger"
          : "doodly-swal-btn doodly-swal-confirm",
      },
    });

    return Boolean(result.isConfirmed);
  },

  success: async ({ title, text = "", confirmText = "Oke" }) => {
    injectStyle();

    await BaseSwal.fire({
      title,
      text,
      iconHtml: "\u2713",
      confirmButtonText: confirmText,
      customClass: {
        popup: "doodly-swal-popup",
        title: "doodly-swal-title",
        htmlContainer: "doodly-swal-text",
        actions: "doodly-swal-actions",
        confirmButton: "doodly-swal-btn doodly-swal-confirm",
        container: "doodly-swal-backdrop",
        icon: "doodly-swal-icon doodly-swal-icon-success",
      },
    });
  },

  error: async ({ title, text = "", confirmText = "Oke" }) => {
    injectStyle();

    await BaseSwal.fire({
      title,
      text,
      iconHtml: "\u2715",
      confirmButtonText: confirmText,
      customClass: {
        popup: "doodly-swal-popup",
        title: "doodly-swal-title",
        htmlContainer: "doodly-swal-text",
        actions: "doodly-swal-actions",
        confirmButton: "doodly-swal-btn doodly-swal-confirm",
        container: "doodly-swal-backdrop",
        icon: "doodly-swal-icon doodly-swal-icon-error",
      },
    });
  },

  info: async ({ title, text = "", confirmText = "Oke" }) => {
    injectStyle();

    await BaseSwal.fire({
      title,
      text,
      iconHtml: "i",
      confirmButtonText: confirmText,
      customClass: {
        popup: "doodly-swal-popup",
        title: "doodly-swal-title",
        htmlContainer: "doodly-swal-text",
        actions: "doodly-swal-actions",
        confirmButton: "doodly-swal-btn doodly-swal-confirm",
        container: "doodly-swal-backdrop",
        icon: "doodly-swal-icon doodly-swal-icon-info",
      },
    });
  },
};

export default showAlert;