export function slugify(text) {
    return text
      .toString()
      .toLowerCase()
      .trim()
      .replace(/\s+/g, '-')     // Replace spaces with -
      .replace(/[^\w\-]+/g, '') // Remove all non-word chars
      .replace(/\-\-+/g, '-');  // Replace multiple - with single -
  }
  
  export function deslugify(slug) {
    return slug.replace(/-/g, ' ').replace(/(^|\s)\S/g, l => l.toUpperCase());
  }