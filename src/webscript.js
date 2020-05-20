// @ts-check


function joinStringsAndArgs(args) {
  const [strings, ...templateArgs] = args;
  const result = [];
  for (const [index, s] of strings.entries()) {
    result.push(s);
    result.push(templateArgs[index])
  }
  return result.join("");
}
export function elementBuilders(elementConstructor, elements = []) {
  function getPropertyValue(...args) {
    let [first] = args;
    if (typeof first === "undefined") {
      first = '';
    }
    else if (Array.isArray(first) && Object.isFrozen(first)) {
      first = joinStringsAndArgs(args);
    }
    let { tagName, props, prop } = this.__element_info__;
    props = { [prop]: first, ...props }
    return createElementBuilder({ tagName, props, prop: null });
  }
  function getPropsValues(props) {
    let { tagName, props: existingProps } = this.__element_info__;
    props = { ...props, ...existingProps }
    return createElementBuilder({ tagName, props, prop: null });
  }
  function createElementBuilder(info) {
    let builder = new Proxy(() => { }, {
      apply(target, thisArg, args) {
        let [first] = args;
        if (Array.isArray(first) && Object.isFrozen(first)) {
          let first = joinStringsAndArgs(args);
          let { tagName, props } = builder.__element_info__;
          props = { "className": first, ...props }
          return createElementBuilder({ tagName, props, prop: null });
        }
        else {
          for (let i = 0; i < args.length; i++) {
            let arg = args[i];
            if (typeof arg === "function" && arg.__element_info__) {
              args[i] = arg();
            }
          }
          let { tagName, props } = builder.__element_info__;
          return elementConstructor(tagName, props, ...args);
        }
      },
      get(target, prop) {
        const result = target[prop];
        if (typeof result !== "undefined") {
          return result;
        }
        if (prop === "props") {
          return getPropsValues;
        }
        else if (typeof prop === "string") {
          if (prop.startsWith("data")) {
            prop = prop.replace(/[A-Z]/g, m => "-" + m.toLowerCase())
          }
          // @ts-ignore
          target.__element_info__.prop = prop;
          return getPropertyValue;
        }
      },
      set(target, prop, value) {
        target[prop] = value;
        return true;
      }
    })
    builder.__element_info__ = info;
    return builder;
  }
  if (elements.length > 0) {
    let builders = [];
    for (const el of elements) {
      builders.push(createElementBuilder({ tagName: el, props: {}, prop: null }));
    }
    return builders;
  }
  else {
    return new Proxy(Object.create(null), {
      get: function (target, prop) {
        const result = target[prop];
        if (typeof result !== "undefined") {
          return result;
        }
        const tagName = prop;
        target[prop] = createElementBuilder({ tagName, props: {}, prop: null });
        return target[prop];
      }
    })
  }
}
