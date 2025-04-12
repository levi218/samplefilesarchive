const iconBase64 =
  'data:image/png;base64,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';

export default iconBase64;
