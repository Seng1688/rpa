export default class Sel {
  path = "//";

  constructor(isChild = false) {
    this.path = isChild ? ".//" : "//";
  }

  xpathStr(s) {
    if (!s.includes(`'`)) return `'${s}'`;
    if (!s.includes(`"`)) return `"${s}"`;

    const parts = s.split(`'`).map((p) => `'${p}'`);
    return `concat(${parts.join(`, "'", `)})`;
  }

  // Exact ID match (any tag)
  id(id) {
    return `${this.path}*[@id=${this.xpathStr(id)}]`;
  }

  // Specific tag + ID
  tagById(tag, id) {
    return `${this.path}${tag}[@id=${this.xpathStr(id)}]`;
  }

  // ID starts with
  idStartsWith(prefix) {
    return `${this.path}*[starts-with(@id, ${this.xpathStr(prefix)})]`;
  }

  // ID contains
  idContains(part) {
    return `${this.path}*[contains(@id, ${this.xpathStr(part)})]`;
  }

  // Tag + ID contains
  tagByIdContains(tag, part) {
    return `${this.path}${tag}[contains(@id, ${this.xpathStr(part)})]`;
  }

  // Tag + exact class match
  tagByClass(tag, className) {
    return `${this.path}${tag}[@class=${this.xpathStr(className)}]`;
  }

  // Tag + class contains
  tagByClassContains(tag, className) {
    return `${this.path}${tag}[contains(@class, ${this.xpathStr(className)})]`;
  }

  // Tag + multiple classes (all must be present)
  tagByClasses(tag, ...classNames) {
    return `${this.path}${tag}[${classNames.map((c) => `contains(@class, ${this.xpathStr(c)})`).join(" and ")}]`;
  }

  // Tag + class contains + text contains (very specific combo)
  tagByClassAndText(tag, className, text) {
    return `${this.path}${tag}[contains(@class, ${this.xpathStr(className)}) and contains(normalize-space(.), ${this.xpathStr(text)})]`;
  }

  // TEXT SELECTORS
  text(tag, text) {
    return `${this.path}${tag}[contains(normalize-space(.), ${this.xpathStr(text)})]`;
  }

  textExact(tag, text) {
    return `${this.path}${tag}[normalize-space(.)=${this.xpathStr(text)}]`;
  }

  button(text) {
    return `${this.path}button[contains(normalize-space(.), ${this.xpathStr(text)})]`;
  }

  buttonType(type) {
    return `${this.path}button[@type=${this.xpathStr(type)}]`;
  }

  buttonTypeWithText(type, text) {
    return `${this.path}button[@type=${this.xpathStr(type)} and contains(normalize-space(.), ${this.xpathStr(text)})]`;
  }

  // ATTRIBUTE SELECTORS
  attr(tag, attr, value) {
    return `${this.path}${tag}[@${attr}=${this.xpathStr(value)}]`;
  }

  attrContains(tag, attr, value) {
    return `${this.path}${tag}[contains(@${attr}, ${this.xpathStr(value)})]`;
  }
}
