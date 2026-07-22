import Toastify from 'toastify-js';
import "toastify-js/src/toastify.css";

export const showToast = {
  error: (text) => {
    Toastify({
      text: text,
      duration: 3000,
      gravity: "top", 
      position: "center", 
      stopOnFocus: true,
      style: {
        background: "#fff",
        color: "#000",
        border: "3px solid black",
        boxShadow: "4px 4px 0px 0px #000000",
        fontWeight: "900",
        borderRadius: "0px",
      }
    }).showToast();
  },
  
  success: (text) => {
    Toastify({
      text: text,
      duration: 3000,
      gravity: "top",
      position: "center",
      stopOnFocus: true,
      style: {
        background: "#00FF55",
        color: "#000",
        border: "3px solid black",
        boxShadow: "4px 4px 0px 0px #000000",
        fontWeight: "900",
        borderRadius: "0px",
      }
    }).showToast();
  }
};