// src/utils/dom.js

/**
 * Creates a DOM element with given tag, class names (BEM), attributes and styles.
 */
export function createElement(tag, classNames = [], attributes = {}, styles = {}) {
  const element = document.createElement(tag);

  if (classNames.length) {
    element.classList.add(...classNames);
  }

  for (const attr in attributes) {
    element.setAttribute(attr, attributes[attr]);
  }

  for (const styleKey in styles) {
    element.style[styleKey] = styles[styleKey];
  }

  return element;
}
