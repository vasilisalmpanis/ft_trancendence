const ALPHANUMERIC_CHARSET = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ $%*+-./:";

function getAlphanumericValue(char) {
    return ALPHANUMERIC_CHARSET.indexOf(char);
}

function encodeData(input) {
    let bitStream = [];
    for (let i = 0; i < input.length; i += 2) {
        if (i + 1 < input.length) {
            const pairValue = 45 * getAlphanumericValue(input[i]) + getAlphanumericValue(input[i + 1]);
            bitStream.push(...numberTo8BitArray(pairValue, 11));
        } else {
            const singleValue = getAlphanumericValue(input[i]);
            bitStream.push(...numberTo8BitArray(singleValue, 6));
        }
    }
    return bitStream;
}

function numberTo8BitArray(num, length) {
    const bits = num.toString(2);
    return Array.from(bits.padStart(length, '0')).map(b => parseInt(b));
}

function applyErrorCorrection(encodedData, ecCodewordsCount) {
    let generator = [1]; // Start with x^0
    for (let i = 0; i < ecCodewordsCount; i++) {
        generator = multiplyPolynomials(generator, [1, Math.pow(2, i)]);
    }

    let message = Array.from(encodedData).concat(new Array(ecCodewordsCount).fill(0));
    for (let i = 0; i < encodedData.length; i++) {
        const coef = message[i];
        if (coef !== 0) {
            for (let j = 0; j < generator.length; j++) {
                message[i + j] ^= gfMultiply(generator[j], coef);
            }
        }
    }
    return message.slice(-ecCodewordsCount); // Return only the EC codewords
}

function multiplyPolynomials(p1, p2) {
    const result = new Array(p1.length + p2.length - 1).fill(0);
    for (let i = 0; i < p1.length; i++) {
        for (let j = 0; j < p2.length; j++) {
            result[i + j] ^= gfMultiply(p1[i], p2[j]); // Galois field multiplication
        }
    }
    return result;
}

function gfMultiply(x, y) {
    let z = 0;
    for (let i = 0; i < 8; i++) {
        if (y & 1) z ^= x;
        let carry = x & 0x80;
        x = (x << 1) & 0xFF;
        if (carry) x ^= 0x1D; // x^8 + x^4 + x^3 + x^2 + 1 (0x1D)
        y >>= 1;
    }
    return z;
}

function createQRMatrix(encodedData, errorCorrectionCodewords) {
    const version = 1;
    const size = 21; // Size for Version 1
    let matrix = new Array(size).fill().map(() => new Array(size).fill(null));

    placeFinderPatterns(matrix);
    placeTimingPatterns(matrix);
    fillMatrixWithCodewords(matrix, encodedData.concat(errorCorrectionCodewords));
    applyMask(matrix); // Apply a simple mask for demonstration

    return matrix;
}

function placeFinderPatterns(matrix) {
    const finderPattern = [
        [1, 1, 1, 1, 1, 1, 1],
        [1, 0, 0, 0, 0, 0, 1],
        [1, 0, 1, 1, 1, 0, 1],
        [1, 0, 1, 1, 1, 0, 1],
        [1, 0, 1, 1, 1, 0, 1],
        [1, 0, 0, 0, 0, 0, 1],
        [1, 1, 1, 1, 1, 1, 1]
    ];

    const patternLocations = [0, matrix.length - 7];
    patternLocations.forEach((offset) => {
        finderPattern.forEach((row, rowIndex) => {
            row.forEach((cell, cellIndex) => {
                matrix[rowIndex][cellIndex + offset] = cell;
                matrix[rowIndex + offset][cellIndex] = cell;
                matrix[cellIndex + offset][rowIndex] = cell;  // Rotating pattern for the other corners
            });
        });
    });
}

function placeTimingPatterns(matrix) {
    for (let i = 6; i < matrix.length - 6; i++) {
        matrix[6][i] = matrix[i][6] = (i % 2 === 0 ? 1 : 0);
    }
}

function fillMatrixWithCodewords(matrix, codewords) {
    const size = matrix.length;
    let index = 0;
    let row = size - 1;
    let col = size - 1;

    // Direction of vertical movement: -1 for upward, 1 for downward
    let direction = -1;

    while (col > 0) {
        if (col === 6) { // Skip the vertical timing pattern column
            col--;
        }

        while (row !== -1 && row !== size) {
            if (matrix[row][col] === null && index < codewords.length) {
                matrix[row][col] = codewords[index++];
            }
            if (matrix[row][col - 1] === null && index < codewords.length) { // Fill the column pair
                matrix[row][col - 1] = codewords[index++];
            }
            row += direction;
        }

        // Change direction of filling (zigzag pattern)
        direction = -direction;
        row += direction; // Adjust row index to stay within bounds
        col -= 2; // Move to the next column pair to the left
    }
}


function applyMask(matrix) {
    const size = matrix.length;
    // Mask pattern 0: (row + column) % 2 == 0
    for (let r = 0; r < size; r++) {
        for (let c = 0; c < size; c++) {
            // Apply mask only to data areas, not to finder patterns, timing patterns, or format information
            // Check that we are not in a finder pattern: top-left, top-right, or bottom-left corners
            if (!isFinderPattern(r, c, size)) {
                if ((r + c) % 2 == 0) {
                    matrix[r][c] = 1 - matrix[r][c];
                }
            }
        }
    }
}

function isFinderPattern(row, col, size) {
    // Check top-left corner finder pattern
    if (row < 8 && col < 8) return true;
    // Check top-right corner finder pattern
    if (row < 8 && col >= size - 8) return true;
    // Check bottom-left corner finder pattern
    if (row >= size - 8 && col < 8) return true;
    
    return false;
}



function drawQRCode(matrix) {
    const pixelSize = 5;
    const canvasSize = matrix.length * pixelSize;
    const canvas = document.createElement('canvas');
    canvas.width = canvasSize;
    canvas.height = canvasSize;
    const ctx = canvas.getContext('2d');

    matrix.forEach((row, y) => {
        row.forEach((cell, x) => {
            ctx.fillStyle = cell === 1 ? 'black' : 'white';
            ctx.fillRect(x * pixelSize, y * pixelSize, pixelSize, pixelSize);
        });
    });

    document.body.appendChild(canvas);
}

const QR = (input) => {
	const encodedData = encodeData(input);
	const errorCorrectionCodewords = applyErrorCorrection(encodedData, 7); // 7 EC codewords for Level L
	const qrMatrix = createQRMatrix(encodedData, errorCorrectionCodewords);
	drawQRCode(qrMatrix);
}

export default QR;