import { TextEncoder, TextDecoder } from "util";

global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;

process.env.SUPPRESS_JEST_WARNINGS = 'true';