/**
 * Generates an SVG path string for a rounded rectangle with iOS smooth corners
 * Based on SVG path generated by Figma
 * @param {number} width - The width of the rectangle
 * @param {number} height - The height of the rectangle
 * @param {number} radius - The radius of the corner
 * @returns {string} - The SVG path data (d attribute value) for the rounded rectangle
 */
function generateiOSRoundedRectPath(width, height, radius) {
    // Ensure radius doesn't exceed half of the smaller dimension
    const maxRadius = Math.min(width / 2, height / 2);
    const r = Math.max(0, Math.min(radius, maxRadius)); // Clamp radius between 0 and maxRadius

    // Avoid division by zero or NaN issues if r is 0
    if (r === 0) {
        return `M0 0 H${width} V${height} H0 Z`; // Simple rectangle
    }

    // Pre-calculate factors for clarity and potential minor performance gain
    const r065 = r * 0.65;
    const r0475 = r * 0.475;
    const r00681 = r * 0.0681;
    const r03413 = r * 0.3413;
    const r01280 = r * 0.1280;
    const r02237 = r * 0.2237;

    // Build path segments
    const topLeft = `M0 ${r}C0 ${r065} 0 ${r0475} ${r00681} ${r03413}C${r01280} ${r02237} ${r02237} ${r01280} ${r03413} ${r00681}C${r0475} 0 ${r065} 0 ${r} 0`;
    const topRight = `H${width - r}C${width - r065} 0 ${width - r0475} 0 ${width - r03413} ${r00681}C${width - r02237} ${r01280} ${width - r01280} ${r02237} ${width - r00681} ${r03413}C${width} ${r0475} ${width} ${r065} ${width} ${r}`;
    const bottomRight = `V${height - r}C${width} ${height - r065} ${width} ${height - r0475} ${width - r00681} ${height - r03413}C${width - r01280} ${height - r02237} ${width - r02237} ${height - r01280} ${width - r03413} ${height - r00681}C${width - r0475} ${height} ${width - r065} ${height} ${width - r} ${height}`;
    const bottomLeft = `H${r}C${r065} ${height} ${r0475} ${height} ${r03413} ${height - r00681}C${r02237} ${height - r01280} ${r01280} ${height - r02237} ${r00681} ${height - r03413}C0 ${height - r0475} 0 ${height - r065} 0 ${height - r}`;

    return `${topLeft}${topRight}${bottomRight}${bottomLeft}Z`;
}

/**
 * Helper to parse CSS numeric properties (Typed OM or string fallback)
 * @param {CSSUnparsedValue | CSSNumericValue | undefined} prop - The property value from props.get()
 * @param {number} defaultValue - The default value if parsing fails or prop is null
 * @returns {number} - The parsed numeric value, clamped at 0
 */
function parseCSSLength(prop, defaultValue) {
    let value = defaultValue;
    if (prop) {
        if (typeof prop.value === 'number') { // CSS Typed OM (e.g., CSS.px(10))
            value = prop.value;
        } else { // String value (e.g., "10px")
            value = parseFloat(prop.toString());
        }
    }
    // Ensure the value is a valid number and non-negative
    return isNaN(value) ? defaultValue : Math.max(0, value);
}

// --- CSS Paint API Classes ---

// For the element itself
registerPaint('iborder', class {
    static get inputProperties() {
        return [
            '--iborder-radius',
        ];
    }

    paint(ctx, size, props) {
        const width = size.width;
        const height = size.height;

        const radius = parseCSSLength(props.get('--iborder-radius'), 10);
        const fillColor = 'black';

        const svgPathString = generateiOSRoundedRectPath(width, height, radius);

        const path = new Path2D(svgPathString);
        ctx.fillStyle = fillColor;
        ctx.fill(path);
    }
});

// For the inner stroke of the element (::before)
registerPaint('iborder-s', class {
    static get inputProperties() {
        return [
            '--iborder-radius',
            '--iborder-width'
        ];
    }

    paint(ctx, size, props) {
        const width = size.width;
        const height = size.height;

        const strokeWidth = parseCSSLength(props.get('--iborder-width'), 2); // Default 2px
        const radius = parseCSSLength(props.get('--iborder-radius'), 10); // Default 10px
        const strokeColor = 'black';

        if (strokeWidth <= 0) {
            return; // Nothing to paint if stroke width is zero or negative
        }

        // Adjust dimensions for inner stroke
        const halfStroke = strokeWidth / 2;
        const adjustedWidth = Math.max(0, width - strokeWidth); // Ensure non-negative
        const adjustedHeight = Math.max(0, height - strokeWidth); // Ensure non-negative
        // Adjust radius for inner stroke, ensure it doesn't become negative
        const adjustedRadius = Math.max(0, radius - halfStroke);

        // Generate path for the *center* of the stroke line
        const svgPathString = generateiOSRoundedRectPath(adjustedWidth, adjustedHeight, adjustedRadius);

        const path = new Path2D(svgPathString);

        ctx.strokeStyle = strokeColor;
        ctx.lineWidth = strokeWidth;

        // Translate context so the stroke is drawn centered on the adjusted path,
        // effectively placing it *inside* the original bounds.
        ctx.translate(halfStroke, halfStroke);

        ctx.stroke(path);

        // Reset transform for subsequent paints if any (though usually not needed per paint call)
        // ctx.setTransform(1, 0, 0, 1, 0, 0); // Optional: Reset transform if needed
    }
});
