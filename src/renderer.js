
// Color history for undo/redo
const colorHistory = [];
let currentHistoryIndex = -1;
const MAX_HISTORY = 100; // Prevent memory bloat

function pushColorToHistory(r, g, b) {
  // Remove any redo states
  if (currentHistoryIndex < colorHistory.length - 1) {
    colorHistory.splice(currentHistoryIndex + 1);
  }
  
  // Add new color
  colorHistory.push({r, g, b});
  
  // Maintain history size limit
  if (colorHistory.length > MAX_HISTORY) {
    colorHistory.shift();
  }
  
  currentHistoryIndex = colorHistory.length - 1;
}

function undoColor() {
  if (currentHistoryIndex > 0) {
    currentHistoryIndex--;
    const {r, g, b} = colorHistory[currentHistoryIndex];
    setRGBandUpdate(r, g, b, false); // false = don't record in history
  }
}

function redoColor() {
  if (currentHistoryIndex < colorHistory.length - 1) {
    currentHistoryIndex++;
    const {r, g, b} = colorHistory[currentHistoryIndex];
    setRGBandUpdate(r, g, b, false); // false = don't record in history
  }
}

function setRGBandUpdate(r, g, b, recordHistory = true) {
  sliderElements.red.value = r;
  sliderElements.green.value = g;
  sliderElements.blue.value = b;
  updateColorDisplay(r, g, b);
  
  if (recordHistory) {
    pushColorToHistory(r, g, b);
  }
}

const sliders = ["red", "green", "blue"];
const sliderElements = {};
const numberInputs = {};
const valueDisplays = {
  colorInput: document.getElementById("colorInput"),
  colorBox: document.getElementById("colorBox"),
  formatSelect: document.getElementById("colorFormat"),
};

sliders.forEach((color) => {
  sliderElements[color] = document.getElementById(color);
  numberInputs[color] = document.getElementById(color + "Number");
});

function updateSliderFill(slider) {
  const val = Number(slider.value);
  const min = Number(slider.min);
  const max = Number(slider.max);
  const percent = ((val - min) / (max - min)) * 100;

  let color;
  if (slider.id === "red") color = "255, 0, 0";
  else if (slider.id === "green") color = "0, 128, 0";
  else if (slider.id === "blue") color = "0, 0, 255";

  const isDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
  const trackColor = isDark ? "#444" : "#ccc";

  slider.style.background = `linear-gradient(to right, rgb(${color}) ${percent}%, ${trackColor} ${percent}%)`;
}

function componentToHex(c) {
  const hex = c.toString(16);
  return (hex.length == 1 ? "0" + hex : hex).toUpperCase();
}

function rgbToHex(r, g, b) {
  return `#${componentToHex(r)}${componentToHex(g)}${componentToHex(b)}`;
}

function hexToRgb(hex) {
  hex = hex.replace(/^#/, "");
  if (hex.length === 3) hex = hex.split("").map((ch) => ch + ch).join("");
  if (hex.length !== 6) return null;
  const bigint = parseInt(hex, 16);
  if (isNaN(bigint)) return null;
  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;
  return { r, g, b };
}

function rgbToHsl(r, g, b) {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h, s, l = (max + min) / 2;
  if (max === min) {
    h = s = 0;
  } else {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }
    h /= 6;
  }
  return { h: Math.round(h * 360), s: Math.round(s * 100), l: Math.round(l * 100) };
}

function rgbToCmyk(r, g, b) {
  if (r === 0 && g === 0 && b === 0) return { c: 0, m: 0, y: 0, k: 100 };
  let c = 1 - r / 255;
  let m = 1 - g / 255;
  let y = 1 - b / 255;
  let k = Math.min(c, m, y);
  c = ((c - k) / (1 - k)) * 100;
  m = ((m - k) / (1 - k)) * 100;
  y = ((y - k) / (1 - k)) * 100;
  k *= 100;
  return { c: Math.round(c), m: Math.round(m), y: Math.round(y), k: Math.round(k) };
}

function rgbCompand(c) {
  return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
}
function rgbUncompand(c) {
  return c <= 0.0031308 ? c * 12.92 : 1.055 * Math.pow(c, 1 / 2.4) - 0.055;
}
function labFn(t) {
  return t > 0.008856 ? Math.pow(t, 1 / 3) : (7.787 * t) + (16 / 116);
}
function labInvFn(t) {
  const t3 = Math.pow(t, 3);
  return t3 > 0.008856 ? t3 : (t - 16 / 116) / 7.787;
}

function rgbToHsv(r, g, b) {
  r /= 255;
  g /= 255;
  b /= 255;

  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h, s, v = max;

  const d = max - min;
  s = max === 0 ? 0 : d / max;

  if (max === min) {
    h = 0; // achromatic
  } else {
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }
    h /= 6;
  }

  return {
    h: Math.round(h * 360),
    s: Math.round(s * 100),
    v: Math.round(v * 100)
  };
}

function hsvToRgb(h, s, v) {
  h /= 360;
  s /= 100;
  v /= 100;

  let r, g, b;

  const i = Math.floor(h * 6);
  const f = h * 6 - i;
  const p = v * (1 - s);
  const q = v * (1 - f * s);
  const t = v * (1 - (1 - f) * s);

  switch (i % 6) {
    case 0: r = v; g = t; b = p; break;
    case 1: r = q; g = v; b = p; break;
    case 2: r = p; g = v; b = t; break;
    case 3: r = p; g = q; b = v; break;
    case 4: r = t; g = p; b = v; break;
    case 5: r = v; g = p; b = q; break;
  }

  return {
    r: Math.round(r * 255),
    g: Math.round(g * 255),
    b: Math.round(b * 255)
  };
}


function rgbToLch(r, g, b) {
  r = rgbCompand(r / 255); g = rgbCompand(g / 255); b = rgbCompand(b / 255);
  const x = r * 0.4124 + g * 0.3576 + b * 0.1805;
  const y = r * 0.2126 + g * 0.7152 + b * 0.0722;
  const z = r * 0.0193 + g * 0.1192 + b * 0.9505;
  const X = x / 0.95047, Y = y / 1.0, Z = z / 1.08883;
  const fx = labFn(X), fy = labFn(Y), fz = labFn(Z);
  const L = 116 * fy - 16;
  const a = 500 * (fx - fy);
  const b_ = 200 * (fy - fz);
  const C = Math.sqrt(a * a + b_ * b_);
  let H = Math.atan2(b_, a) * (180 / Math.PI);
  if (H < 0) H += 360;
  return { l: +L.toFixed(2), c: +C.toFixed(2), h: +H.toFixed(2) };
}

function lchToRgb(L, C, H) {
  const hRad = H * Math.PI / 180;
  const a = C * Math.cos(hRad);
  const b_ = C * Math.sin(hRad);
  const fy = (L + 16) / 116;
  const fx = fy + a / 500;
  const fz = fy - b_ / 200;
  const X = labInvFn(fx) * 0.95047;
  const Y = labInvFn(fy) * 1.0;
  const Z = labInvFn(fz) * 1.08883;
  let r = X * 3.2406 + Y * -1.5372 + Z * -0.4986;
  let g = X * -0.9689 + Y * 1.8758 + Z * 0.0415;
  let b = X * 0.0557 + Y * -0.2040 + Z * 1.0570;
  r = rgbUncompand(r); g = rgbUncompand(g); b = rgbUncompand(b);
  return {
    r: Math.max(0, Math.min(255, Math.round(r * 255))),
    g: Math.max(0, Math.min(255, Math.round(g * 255))),
    b: Math.max(0, Math.min(255, Math.round(b * 255)))
  };
}

function rgbToLab(r, g, b) {
  r = rgbCompand(r / 255);
  g = rgbCompand(g / 255);
  b = rgbCompand(b / 255);

  const x = r * 0.4124 + g * 0.3576 + b * 0.1805;
  const y = r * 0.2126 + g * 0.7152 + b * 0.0722;
  const z = r * 0.0193 + g * 0.1192 + b * 0.9505;

  const X = x / 0.95047, Y = y / 1.0, Z = z / 1.08883;
  const fx = labFn(X), fy = labFn(Y), fz = labFn(Z);

  const L = 116 * fy - 16;
  const a = 500 * (fx - fy);
  const b_ = 200 * (fy - fz);

  return { l: +L.toFixed(2), a: +a.toFixed(2), b: +b_.toFixed(2) };
}

function labToRgb(L, a, b_) {
  const fy = (L + 16) / 116;
  const fx = fy + a / 500;
  const fz = fy - b_ / 200;

  const X = labInvFn(fx) * 0.95047;
  const Y = labInvFn(fy) * 1.0;
  const Z = labInvFn(fz) * 1.08883;

  let r = X * 3.2406 + Y * -1.5372 + Z * -0.4986;
  let g = X * -0.9689 + Y * 1.8758 + Z * 0.0415;
  let b = X * 0.0557 + Y * -0.2040 + Z * 1.0570;

  r = rgbUncompand(r);
  g = rgbUncompand(g);
  b = rgbUncompand(b);

  return {
    r: Math.max(0, Math.min(255, Math.round(r * 255))),
    g: Math.max(0, Math.min(255, Math.round(g * 255))),
    b: Math.max(0, Math.min(255, Math.round(b * 255)))
  };
}

function rgbToXyz(r, g, b) {
  r = rgbCompand(r / 255);
  g = rgbCompand(g / 255);
  b = rgbCompand(b / 255);

  // Observer = 2°, Illuminant = D65
  const x = r * 0.4124 + g * 0.3576 + b * 0.1805;
  const y = r * 0.2126 + g * 0.7152 + b * 0.0722;
  const z = r * 0.0193 + g * 0.1192 + b * 0.9505;

  return {
    x: +(x * 100).toFixed(2),
    y: +(y * 100).toFixed(2),
    z: +(z * 100).toFixed(2)
  };
}

function xyzToRgb(x, y, z) {
  // Convert to 0..1 scale
  x /= 100; y /= 100; z /= 100;

  let r = x * 3.2406 + y * -1.5372 + z * -0.4986;
  let g = x * -0.9689 + y * 1.8758 + z * 0.0415;
  let b = x * 0.0557 + y * -0.2040 + z * 1.0570;

  r = rgbUncompand(r);
  g = rgbUncompand(g);
  b = rgbUncompand(b);

  return {
    r: Math.max(0, Math.min(255, Math.round(r * 255))),
    g: Math.max(0, Math.min(255, Math.round(g * 255))),
    b: Math.max(0, Math.min(255, Math.round(b * 255)))
  };
}

function updateColorDisplay(r, g, b) {
  sliders.forEach(color => updateSliderFill(sliderElements[color]));
  if (Number(numberInputs.red.value) !== r) numberInputs.red.value = r;
  if (Number(numberInputs.green.value) !== g) numberInputs.green.value = g;
  if (Number(numberInputs.blue.value) !== b) numberInputs.blue.value = b;
  valueDisplays.colorBox.style.backgroundColor = `rgb(${r}, ${g}, ${b})`;
  const format = valueDisplays.formatSelect.value;
  if (format === "hex") {
    // Display HEX in uppercase for consistency
    valueDisplays.colorInput.value = rgbToHex(r, g, b).toUpperCase();
    // Ensure width recalculation runs after the value change and any layout
    // caused by it has settled. Use the scheduler to avoid intermittent
    // failures when switching formats like LAB.
    scheduleUpdateWidth();
  } else if (format === "hsl") {
    const hsl = rgbToHsl(r, g, b);
    valueDisplays.colorInput.value = `${hsl.h}, ${hsl.s}%, ${hsl.l}`;
    scheduleUpdateWidth();
  } else if (format === "cmyk") {
    const cmyk = rgbToCmyk(r, g, b);
    valueDisplays.colorInput.value = `${cmyk.c}%, ${cmyk.m}%, ${cmyk.y}%, ${cmyk.k}%`;
    scheduleUpdateWidth();
  } else if (format === "lch") {
    const lch = rgbToLch(r, g, b);
    valueDisplays.colorInput.value = `${lch.l}%, ${lch.c}, ${lch.h}`;
    scheduleUpdateWidth();
  } else if (format === "lab") {
    const lab = rgbToLab(r, g, b);
    valueDisplays.colorInput.value = `${lab.l}, ${lab.a}, ${lab.b}`;
    scheduleUpdateWidth();
  } else if (format === "hsv") {
    const hsv = rgbToHsv(r, g, b);
    valueDisplays.colorInput.value = `${hsv.h}, ${hsv.s}%, ${hsv.v}%`;
    scheduleUpdateWidth();
  } else if (format === "xyz") {
  const xyz = rgbToXyz(r, g, b);
  valueDisplays.colorInput.value = `${xyz.x}, ${xyz.y}, ${xyz.z}`;
  scheduleUpdateWidth();
}
}

function syncFromSliders() {
  const r = Number(sliderElements.red.value);
  const g = Number(sliderElements.green.value);
  const b = Number(sliderElements.blue.value);
  updateColorDisplay(r, g, b);
}

const input = document.getElementById('colorInput');
const calc = document.getElementById('widthCalc');

function updateWidth() {
  const style = window.getComputedStyle(input);
  calc.style.font = style.font;
  calc.style.fontSize = style.fontSize;
  calc.style.fontWeight = style.fontWeight;
  calc.style.letterSpacing = style.letterSpacing;
  calc.style.textTransform = style.textTransform;
  calc.style.fontFamily = style.fontFamily;
  calc.style.padding = style.padding;

  let val = input.value || input.placeholder || "";
  val = val.replace(/ /g, '\u00a0'); // preserve spaces
  calc.textContent = val;

  const newWidth = calc.offsetWidth + 2; // 2px buffer
  const minWidth = 100;

  // Compute available width inside the parent (.controls -> <p>) so the
  // input expands up to the space left by the select element.
  const parent = input.parentElement; // the <p> flex container
  const parentStyle = window.getComputedStyle(parent);
  const parentPaddingLeft = parseFloat(parentStyle.paddingLeft) || 0;
  const parentPaddingRight = parseFloat(parentStyle.paddingRight) || 0;
  const parentWidth = parent.clientWidth - parentPaddingLeft - parentPaddingRight;

  const selectEl = document.getElementById('colorFormat');
  const selectWidth = selectEl ? selectEl.offsetWidth : 0;
  const gap = parseFloat(parentStyle.gap) || 10;

  // Leave a small buffer for spacing
  const maxWidth = Math.max(50, parentWidth - selectWidth - gap - 8);

  let adjustedWidth = Math.max(minWidth, newWidth);

  // Snap to 10px increments so resizing is less janky
  adjustedWidth = Math.ceil(adjustedWidth / 10) * 10;

  if (adjustedWidth > maxWidth) adjustedWidth = maxWidth;

  input.style.width = adjustedWidth + 'px';
}



input.addEventListener('input', updateWidth);
input.addEventListener('paste', () => setTimeout(scheduleUpdateWidth, 0));

// Schedule width updates via requestAnimationFrame to ensure measurements
// occur after any layout changes (for example when the select's value
// changes and the browser needs to reflow). This prevents intermittent
// failures to expand the input when switching formats like LAB.
let widthRaf = null;
function scheduleUpdateWidth() {
  if (widthRaf) cancelAnimationFrame(widthRaf);
  widthRaf = requestAnimationFrame(() => {
    widthRaf = null;
    updateWidth();
  });
}

// Use the scheduler for input events that may coincide with layout
// changes. Kept lightweight so frequent edits still feel snappy.
input.addEventListener('input', scheduleUpdateWidth);

scheduleUpdateWidth(); // call on load

// Right-click (contextmenu) on the color input: copy current displayed value
// and show a temporary feedback message for 1.5s. Left-click should allow
// editing (focus + select). While the feedback is visible we prevent editing.
(function () {
  let copiedTimer = null;
  let isShowing = false;
  let isProcessing = false;
  let originalValue = null;
  let prevTextTransform = '';
  const copiedMessage = 'Copied!';

  async function copyText(text) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      return navigator.clipboard.writeText(text);
    }
    // Fallback for older browsers
    return new Promise((resolve, reject) => {
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.style.position = 'fixed';
      ta.style.left = '-9999px';
      document.body.appendChild(ta);
      ta.focus();
      ta.select();
      try {
        const ok = document.execCommand('copy');
        document.body.removeChild(ta);
        ok ? resolve() : reject(new Error('execCommand failed'));
      } catch (err) {
        document.body.removeChild(ta);
        reject(err);
      }
    });
  }

  function restoreCopiedState() {
    if (copiedTimer) {
      clearTimeout(copiedTimer);
      copiedTimer = null;
    }
    if (isShowing) {
      input.value = originalValue || '';
      input.readOnly = false;
      input.style.textTransform = prevTextTransform || '';
      scheduleUpdateWidth();
      isShowing = false;
    }
    isProcessing = false;
    originalValue = null;
    prevTextTransform = '';
  }

  // Left-click (button 0) should enable editing: focus and select existing text
  input.addEventListener('mousedown', (ev) => {
    if (ev.button === 0) {
      // If the 'Copied!' feedback is currently showing, prevent left-click
      // from enabling editing or focusing the input until we restore state.
      if (isShowing) {
        ev.preventDefault();
        input.readOnly = true;
        // Ensure the input doesn't gain focus (defensive)
        setTimeout(() => input.blur(), 0);
        return;
      }

      input.readOnly = false;
      // Let the default focus behavior run, but ensure the text is selected
      // after the event loop so it doesn't conflict with browser selection.
      setTimeout(() => {
        input.focus();
        input.select();
      }, 0);
    }
  });

  input.addEventListener('contextmenu', async (ev) => {
    ev.preventDefault();

    // If a copy is currently in-flight (but not yet showing feedback), ignore
    if (isProcessing && !isShowing) return;

    const current = input.value;

    // If feedback is already showing, restart the timeout and re-copy the value
    if (isShowing) {
      // attempt to copy again (best-effort)
      try {
        await copyText(originalValue || current);
      } catch (err) {
        console.warn('Copy failed', err);
      }
      if (copiedTimer) clearTimeout(copiedTimer);
      copiedTimer = setTimeout(() => {
        restoreCopiedState();
      }, 1500);
      return;
    }

    // Start a new copy/show cycle
    isProcessing = true;
    originalValue = current;
    input.readOnly = true;
    input.blur();

    try {
      await copyText(originalValue);
    } catch (err) {
      // ignore copy errors but still show UI feedback
      console.warn('Copy failed', err);
    }

    // Show feedback (consistent casing). Temporarily override the CSS
    // text-transform so the capital 'C' is visible, then restore it.
    prevTextTransform = input.style.textTransform || '';
    input.style.textTransform = 'none';
    input.value = copiedMessage;
    scheduleUpdateWidth();
    isShowing = true;

    // Restore after 1.5s
    copiedTimer = setTimeout(() => {
      restoreCopiedState();
    }, 1500);
  });

  // If the user switches format while the copied message is showing,
  // immediately restore the original value and cancel the timer.
  if (valueDisplays && valueDisplays.formatSelect) {
    valueDisplays.formatSelect.addEventListener('change', () => {
      restoreCopiedState();
    });
  }
})();


function syncFromNumbers() {
  const r = Number(numberInputs.red.value);
  const g = Number(numberInputs.green.value);
  const b = Number(numberInputs.blue.value);
  sliderElements.red.value = r;
  sliderElements.green.value = g;
  sliderElements.blue.value = b;
  updateColorDisplay(r, g, b);
}

function syncFromTextInput() {
  // Accept user input case-insensitively, but normalize display to uppercase for hex
  let val = valueDisplays.colorInput.value.trim();
  const format = valueDisplays.formatSelect.value;
  if (format === "hex") {
    if (!val.startsWith("#")) val = "#" + val;
    // Normalize to uppercase for display consistency
    const valUp = val.toUpperCase();
    const rgb = hexToRgb(valUp);
    if (rgb) {
      setRGBandUpdate(rgb.r, rgb.g, rgb.b);
      // reflect normalized uppercase hex back to the input
      valueDisplays.colorInput.value = valUp;
      scheduleUpdateWidth();
    }
  } else if (format === "hsl") {
    const match = val.match(/(\d+),\s*(\d+)%?,\s*(\d+)%?/);
    if (match) {
      const h = +match[1], s = +match[2] / 100, l = +match[3] / 100;
      const rgb = hslToRgb(h, s, l);
      setRGBandUpdate(rgb.r, rgb.g, rgb.b);
    }
  } else if (format === "cmyk") {
    const match = val.match(/(\d+)%?,\s*(\d+)%?,\s*(\d+)%?,\s*(\d+)%?/);
    if (match) {
      const c = +match[1] / 100, m = +match[2] / 100, y = +match[3] / 100, k = +match[4] / 100;
      const rgb = cmykToRgb(c, m, y, k);
      setRGBandUpdate(rgb.r, rgb.g, rgb.b);
    }
  } else if (format === "lch") {
    const match = val.match(/([\d.]+)%?,\s*([\d.]+),\s*([\d.]+)/);
    if (match) {
      const l = +match[1], c = +match[2], h = +match[3];
      const rgb = lchToRgb(l, c, h);
      setRGBandUpdate(rgb.r, rgb.g, rgb.b);
    }
  } else if (format === "hsv") {
    const match = val.match(/(\d+),\s*(\d+)%?,\s*(\d+)%?/);
    if (match) {
      const h = +match[1], s = +match[2], v = +match[3];
      const rgb = hsvToRgb(h, s, v);
      setRGBandUpdate(rgb.r, rgb.g, rgb.b);
    }
  } else if (format === "xyz") {
    const match = val.match(/([\d.]+),\s*([\d.]+),\s*([\d.]+)/);
    if (match) {
      const x = +match[1], y = +match[2], z = +match[3];
      const rgb = xyzToRgb(x, y, z);
      setRGBandUpdate(rgb.r, rgb.g, rgb.b);
    }
  }


}

function hslToRgb(h, s, l) {
  h /= 360;
  let r, g, b;
  if (s === 0) {
    r = g = b = l;
  } else {
    const hue2rgb = (p, q, t) => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1 / 6) return p + (q - p) * 6 * t;
      if (t < 1 / 2) return q;
      if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
      return p;
    }
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    r = hue2rgb(p, q, h + 1 / 3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1 / 3);
  }
  return { r: Math.round(r * 255), g: Math.round(g * 255), b: Math.round(b * 255) };
}

function cmykToRgb(c, m, y, k) {
  const r = 255 * (1 - c) * (1 - k);
  const g = 255 * (1 - m) * (1 - k);
  const b = 255 * (1 - y) * (1 - k);
  return { r: Math.round(r), g: Math.round(g), b: Math.round(b) };
}

// === Event Listeners ===
sliders.forEach(color => {
  sliderElements[color].addEventListener("input", () => {
    numberInputs[color].value = sliderElements[color].value;
    syncFromSliders();
    // Record history after user finishes dragging
    const r = Number(sliderElements.red.value);
    const g = Number(sliderElements.green.value);
    const b = Number(sliderElements.blue.value);
    pushColorToHistory(r, g, b);
  });
  numberInputs[color].addEventListener("input", () => {
    let val = Number(numberInputs[color].value);
    val = isNaN(val) ? 0 : Math.max(0, Math.min(255, val));
    numberInputs[color].value = val;
    sliderElements[color].value = val;
    syncFromNumbers();
    // Record history after number input changes
    const r = Number(sliderElements.red.value);
    const g = Number(sliderElements.green.value);
    const b = Number(sliderElements.blue.value);
    pushColorToHistory(r, g, b);
  });
});

valueDisplays.formatSelect.addEventListener("change", syncFromSliders);
valueDisplays.colorInput.addEventListener("change", syncFromTextInput);

// Initialize display
syncFromSliders();

// Keep the input width up-to-date when the window or format changes
window.addEventListener('resize', updateWidth);
valueDisplays.formatSelect.addEventListener('change', scheduleUpdateWidth);

// Respond to dark mode changes
window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", () => {
  sliders.forEach(color => updateSliderFill(sliderElements[color]));
});

// Eyedropper button click handler
document.getElementById('eyedropperBtn').addEventListener('click', async () => {
  try {
    const eyeDropper = new EyeDropper();
    const result = await eyeDropper.open();
    const color = result.sRGBHex;
    const rgb = hexToRgb(color.substring(1));
    if (rgb) {
      setRGBandUpdate(rgb.r, rgb.g, rgb.b);
    }
  } catch (e) {
    console.error('EyeDropper failed:', e);
  }
});

// Generate Random Color button handler
const genBtn = document.getElementById('genRandColBtn');
if (genBtn) {
  genBtn.addEventListener('click', () => {
    // generate random color and update UI
    const r = Math.floor(Math.random() * 256);
    const g = Math.floor(Math.random() * 256);
    const b = Math.floor(Math.random() * 256);
    if (typeof setRGBandUpdate === 'function') setRGBandUpdate(r, g, b);
  });
}

// Handle keyboard shortcuts (Cmd+Z, Cmd+Shift+Z, Cmd+P)
window.addEventListener("keydown", async (e) => {
  // Don't handle shortcuts when focused on input elements
  if (document.activeElement.tagName === 'INPUT') return;

  // Handle Cmd+Z for undo
  if (e.metaKey && !e.shiftKey && (e.key === "z" || e.key === "Z")) {
    e.preventDefault();
    undoColor();
    return;
  }

  // Handle Cmd+Shift+Z for redo
  if (e.metaKey && e.shiftKey && (e.key === "z" || e.key === "Z")) {
    e.preventDefault();
    redoColor();
    return;
  }

  // Handle Cmd+P for eyedropper
  if (e.metaKey && (e.key === "P" || e.key === "p")) {
    e.preventDefault();
    if ("EyeDropper" in window) {
      try {
        const eyeDropper = new EyeDropper();
        const result = await eyeDropper.open();
        const rgb = hexToRgb(result.sRGBHex);
        if (rgb) setRGBandUpdate(rgb.r, rgb.g, rgb.b);
      } catch (err) {
        console.error("EyeDropper failed:", err);
      }
    } else {
      alert("Your browser does not support the EyeDropper API.");
    }
  }
});

// Also respond to the menu/accelerator triggered from the main process
if (window.electronAPI && typeof window.electronAPI.onPick === 'function') {
  window.electronAPI.onPick(async () => {
    try {
      if ("EyeDropper" in window) {
        const eyeDropper = new EyeDropper();
        const result = await eyeDropper.open();
        const rgb = hexToRgb(result.sRGBHex);
        if (rgb) setRGBandUpdate(rgb.r, rgb.g, rgb.b);
      } else {
        alert("Your browser does not support the EyeDropper API. Chromium Currently Supports it.");
      }
    } catch (err) {
      console.error('EyeDropper failed or was cancelled', err);
    }
  });
}

// Respond to Generate Random Color from main (IPC) if available
if (window.electronAPI && typeof window.electronAPI.onGenerate === 'function') {
  window.electronAPI.onGenerate(() => {
    try {
      const r = Math.floor(Math.random() * 256);
      const g = Math.floor(Math.random() * 256);
      const b = Math.floor(Math.random() * 256);
      if (typeof setRGBandUpdate === 'function') setRGBandUpdate(r, g, b);
    } catch (err) {
      console.error('Failed to generate random color from IPC:', err);
    }
  });
}

// Copy button color contrast and functionality
function updateCopyButtonContrast() {
  const r = Number(sliderElements.red.value);
  const g = Number(sliderElements.green.value);
  const b = Number(sliderElements.blue.value);
  
  // Calculate relative luminance
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  
  // Set icon color based on background luminance
  const copyIcon = document.querySelector('.copy-icon');
  if (luminance > 0.5) {
    copyIcon.style.color = '#000000';
  } else {
    copyIcon.style.color = '#ffffff';
  }
}

// Copy format handling
document.getElementById('copyFormat').addEventListener('change', (e) => {
  const format = e.target.value;
  const r = Number(sliderElements.red.value);
  const g = Number(sliderElements.green.value);
  const b = Number(sliderElements.blue.value);
  let copyText = '';
  
  switch (format) {
    case 'swiftui':
      copyText = `Color(red: ${(r/255).toFixed(3)}, green: ${(g/255).toFixed(3)}, blue: ${(b/255).toFixed(3)})`;
      break;
    case 'flutter-hex':
      copyText = `Color(0xFF${componentToHex(r)}${componentToHex(g)}${componentToHex(b)})`;
      break;
    case 'flutter-rgb':
      copyText = `Color.fromRGBO(${r}, ${g}, ${b}, 1.0)`;
      break;
    case 'css-rgb':
      copyText = `rgb(${r}, ${g}, ${b})`;
      break;
    case 'css-hsl':
      const hsl = rgbToHsl(r, g, b);
      copyText = `hsl(${hsl.h}, ${hsl.s}%, ${hsl.l}%)`;
      break;
    case 'hex':
      copyText = rgbToHex(r, g, b);
      break;
  }
  
  if (copyText) {
    navigator.clipboard.writeText(copyText).then(() => {
      e.target.value = ''; // Reset dropdown
      document.getElementById('copyFormat').classList.remove('show'); // Hide dropdown after selection
    }).catch(err => console.error('Failed to copy:', err));
  }
});

// Update copy button contrast when color changes
function updateColorDisplay(r, g, b) {
  sliders.forEach(color => updateSliderFill(sliderElements[color]));
  if (Number(numberInputs.red.value) !== r) numberInputs.red.value = r;
  if (Number(numberInputs.green.value) !== g) numberInputs.green.value = g;
  if (Number(numberInputs.blue.value) !== b) numberInputs.blue.value = b;
  valueDisplays.colorBox.style.backgroundColor = `rgb(${r}, ${g}, ${b})`;
  updateCopyButtonContrast(); // Add this line
  const format = valueDisplays.formatSelect.value;
  if (format === "hex") {
    valueDisplays.colorInput.value = rgbToHex(r, g, b).toUpperCase();
    scheduleUpdateWidth();
  } else if (format === "hsl") {
    const hsl = rgbToHsl(r, g, b);
    valueDisplays.colorInput.value = `${hsl.h}, ${hsl.s}%, ${hsl.l}%`;
    scheduleUpdateWidth();
  } else if (format === "cmyk") {
    const cmyk = rgbToCmyk(r, g, b);
    valueDisplays.colorInput.value = `${cmyk.c}%, ${cmyk.m}%, ${cmyk.y}%, ${cmyk.k}%`;
    scheduleUpdateWidth();
  } else if (format === "lch") {
    const lch = rgbToLch(r, g, b);
    valueDisplays.colorInput.value = `${lch.l}%, ${lch.c}, ${lch.h}`;
    scheduleUpdateWidth();
  } else if (format === "lab") {
    const lab = rgbToLab(r, g, b);
    valueDisplays.colorInput.value = `${lab.l}, ${lab.a}, ${lab.b}`;
    scheduleUpdateWidth();
  } else if (format === "hsv") {
    const hsv = rgbToHsv(r, g, b);
    valueDisplays.colorInput.value = `${hsv.h}, ${hsv.s}%, ${hsv.v}%`;
    scheduleUpdateWidth();
  } else if (format === "xyz") {
    const xyz = rgbToXyz(r, g, b);
    valueDisplays.colorInput.value = `${xyz.x}, ${xyz.y}, ${xyz.z}`;
    scheduleUpdateWidth();
  }
}

// Clear history when window closes
window.addEventListener('beforeunload', () => {
  colorHistory.length = 0;
  currentHistoryIndex = -1;
});
