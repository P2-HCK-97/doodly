'use strict';

/**
 * Builds a deterministic Dicebear avatar URL from a username, so the
 * same username always renders the same avatar for everyone in the room.
 *
 * @param {string} username
 * @returns {string} Dicebear SVG avatar URL.
 */
function generateAvatarUrl(username) {
  const style = 'avataaars';
  const seed = encodeURIComponent(username);

  return `https://api.dicebear.com/9.x/${style}/svg?seed=${seed}`;
}

module.exports = {
  generateAvatarUrl,
};

// Contoh manual:
//   generateAvatarUrl('Andi')
//     -> 'https://api.dicebear.com/9.x/avataaars/svg?seed=Andi'
//   generateAvatarUrl('Budi Santoso')
//     -> 'https://api.dicebear.com/9.x/avataaars/svg?seed=Budi%20Santoso'
//   generateAvatarUrl('Andi')  (dipanggil lagi)
//     -> 'https://api.dicebear.com/9.x/avataaars/svg?seed=Andi'  (sama persis, deterministic)
