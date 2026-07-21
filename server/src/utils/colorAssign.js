'use strict';

// Fixed palette of hex colors, chosen to be contrasting and easy on the eye.
const COLOR_PALETTE = [
  '#EF4444', // red
  '#3B82F6', // blue
  '#22C55E', // green
  '#F97316', // orange
  '#A855F7', // purple
  '#EC4899', // pink
  '#EAB308', // yellow
  '#14B8A6', // teal
  '#6366F1', // indigo
  '#84CC16', // lime
];

/**
 * Picks a color from the fixed palette that isn't already used by
 * another player in the same room. Falls back to a random palette
 * color (duplicates allowed) once every color is taken, so a crowded
 * room never errors out just for lack of unique colors.
 *
 * @param {string[]} existingColors - hex colors already assigned to
 *   other players in the room.
 * @returns {string} hex color.
 */
function assignColor(existingColors) {
  const availableColors = COLOR_PALETTE.filter(
    (color) => !existingColors.includes(color)
  );

  if (availableColors.length > 0) {
    return availableColors[0];
  }

  return COLOR_PALETTE[Math.floor(Math.random() * COLOR_PALETTE.length)];
}

module.exports = {
  assignColor,
  COLOR_PALETTE,
};

// Contoh manual:
//   assignColor([])
//     -> '#EF4444'  (palette masih kosong, ambil warna pertama)
//   assignColor(['#EF4444', '#3B82F6'])
//     -> '#22C55E'  (2 warna pertama udah kepake, ambil yang berikutnya belum kepake)
//   assignColor(COLOR_PALETTE)  (semua 10 warna udah kepake)
//     -> salah satu dari COLOR_PALETTE, random tiap kali dipanggil (boleh dobel)
