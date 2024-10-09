export function slugify(text) {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .normalize('NFD')                 // Normalize to decomposed form
    .replace(/[\u0300-\u036f]/g, '')  // Remove diacritical marks
    .replace(/\s+/g, '-')             // Replace spaces with -
    .replace(/[^\w\-]+/g, '')         // Remove all non-word chars (except -)
    .replace(/\-\-+/g, '-')           // Replace multiple - with single -
    .replace(/^-+/, '')               // Trim - from start of text
    .replace(/-+$/, '');              // Trim - from end of text
}
  
  export function deslugify(slug) {
    return slug.replace(/-/g, ' ').replace(/(^|\s)\S/g, l => l.toUpperCase());
  }