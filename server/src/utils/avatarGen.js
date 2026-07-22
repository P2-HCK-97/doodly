"use strict";

function generateAvatarUrl(username) {
  const safeUsername =
    typeof username === "string" && username.trim()
      ? username.trim()
      : "Doodly";

  const seed = encodeURIComponent(safeUsername);

  return `https://api.dicebear.com/10.x/lorelei/svg?seed=${seed}`;
}

module.exports = {
  generateAvatarUrl,
};
