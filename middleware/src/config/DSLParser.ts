interface ParsedQuery {
  assetType: string;
  field?: string;
  operator?: string;
  value?: string;
}

interface ParseResult {
  query: ParsedQuery | null;
  error?: string;
}

export function DSLParser(query: string): ParseResult {
  const trimmed = query.trim();

  // Only allow a valid simple query if it's a single word (e.g., "lettuce")
  if (
    !trimmed.includes(".") &&
    !trimmed.includes("==") &&
    !trimmed.includes(">=") &&
    !trimmed.includes("<=") &&
    !trimmed.includes(">") &&
    !trimmed.includes("<") &&
    !trimmed.includes("!=") &&
    /^[a-z_]+$/.test(trimmed) // only lowercase letters and underscores
  ) {
    return { query: { assetType: trimmed } };
  }

  // Check for invalid characters in simple query
  if (!trimmed.includes(".") && !/^[a-z_]+$/.test(trimmed)) {
    return { 
      query: null, 
      error: "Invalid characters in query. Only lowercase letters and underscores are allowed for simple queries." 
    };
  }

  const operators = ["like", "is","==", ">=", "<=", ">", "<", "!="];
  const operator = operators.find(op => trimmed.includes(op));
  if (!operator) {
    return { 
      query: null, 
      error: "Invalid operator. Only 'like', 'is', '==', '>=', '<=', '>', '<', and '!=' are supported." 
    };
  }

  const [left, right] = trimmed.split(operator).map(s => s.trim());
  if (!left || !right) {
    return { 
      query: null, 
      error: "Invalid query format. Both sides of the operator must contain values." 
    };
  }

  // Strip single quotes from the right side value
  const cleanRight = right.replace(/^'|'$/g, '');

  // Must be exactly one dot (i.e., "group.field")
  const parts = left.split(".");
  if (parts.length !== 2) {
    return { 
      query: null, 
      error: "Invalid field reference. Must use format 'group.field' with exactly one dot." 
    };
  }

  const [assetType, field] = parts;
  if (!assetType || !field) {
    return { 
      query: null, 
      error: "Invalid field reference. Both group and field names must be specified." 
    };
  }

  return {
    query: {
      assetType,
      field,
      operator,
      value: cleanRight
    }
  };
}
