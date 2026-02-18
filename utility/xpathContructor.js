export const sel = {
  /* ========================
     ID SELECTORS
  ======================== */

  // Exact ID match (any tag)
  id: (id) => `//*[@id=${xpathStr(id)}]`,

  // Specific tag + ID
  tagById: (tag, id) => `//${tag}[@id=${xpathStr(id)}]`,

  // ID starts with
  idStartsWith: (prefix) => `//*[starts-with(@id, ${xpathStr(prefix)})]`,

  // ID contains
  idContains: (part) => `//*[contains(@id, ${xpathStr(part)})]`,

  // Tag + ID contains
  tagByIdContains: (tag, part) => `//${tag}[contains(@id, ${xpathStr(part)})]`,

  /* ========================
     CLASS SELECTORS
  ======================== */

  // Tag + exact class match
  tagByClass: (tag, className) => `//${tag}[@class=${xpathStr(className)}]`,

  // Tag + class contains
  tagByClassContains: (tag, className) =>
    `//${tag}[contains(@class, ${xpathStr(className)})]`,

  // Tag + multiple classes (all must be present)
  tagByClasses: (tag, ...classNames) =>
    `//${tag}[${classNames.map((c) => `contains(@class, ${xpathStr(c)})`).join(" and ")}]`,

  // Tag + class contains + text contains (very specific combo)
  tagByClassAndText: (tag, className, text) =>
    `//${tag}[contains(@class, ${xpathStr(className)}) and contains(normalize-space(.), ${xpathStr(text)})]`,

  /* ========================
     TEXT SELECTORS
  ======================== */

  text: (tag, text) =>
    `//${tag}[contains(normalize-space(.), ${xpathStr(text)})]`,

  textExact: (tag, text) => `//${tag}[normalize-space(.)=${xpathStr(text)}]`,

  button: (text) => `//button[contains(normalize-space(.), ${xpathStr(text)})]`,

  // Button by exact type
  buttonType: (type) => `//button[@type=${xpathStr(type)}]`,

  // Button by type + text (very useful combo)
  buttonTypeWithText: (type, text) =>
    `//button[@type=${xpathStr(type)} and contains(normalize-space(.), ${xpathStr(text)})]`,

  /* ========================
     ATTRIBUTE SELECTORS
  ======================== */

  attr: (tag, attr, value) => `//${tag}[@${attr}=${xpathStr(value)}]`,

  attrContains: (tag, attr, value) =>
    `//${tag}[contains(@${attr}, ${xpathStr(value)})]`,

  /* ========================
     SCOPING
  ======================== */

  within: (containerXpath, childXpath) =>
    `${containerXpath}${
      childXpath.startsWith("//") ? childXpath.replace("//", "//") : childXpath
    }`,
};

function xpathStr(s) {
  if (!s.includes(`'`)) return `'${s}'`;
  if (!s.includes(`"`)) return `"${s}"`;

  const parts = s.split(`'`).map((p) => `'${p}'`);
  return `concat(${parts.join(`, "'", `)})`;
}
