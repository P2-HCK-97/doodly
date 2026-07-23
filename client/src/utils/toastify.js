import Toastify from "toastify-js";
import "toastify-js/src/toastify.css";

function getToastParent() {
  if (typeof document === "undefined") {
    return undefined;
  }

  const openDialog = document.querySelector("dialog[open]");

  return openDialog || undefined;
}

const baseStyle = {
  color: "#000",
  border: "3px solid black",
  boxShadow: "4px 4px 0px 0px #000000",
  fontWeight: "900",
  borderRadius: "0px",
};

function fire(text, background) {
  Toastify({
    text,
    duration: 3000,
    gravity: "top",
    position: "center",
    stopOnFocus: true,
    selector: getToastParent(),
    style: {
      ...baseStyle,
      background,
    },
  }).showToast();
}

export const showToast = {
  error: (text) => fire(text, "#fff"),
  success: (text) => fire(text, "#00FF55"),
};