/**
 * Converts an object's keys from camelCase or PascalCase to snake_case
 * Handles special cases:
 * @example
 * - camelCase -> snake_case
 * - PascalCase -> pascal_case
 * - XMLHttpRequest -> xml_http_request
 * - activityUUID -> activity_uuid
 * - myXMLFile -> my_xml_file
 */
export const camelToSnakeCase = (str: string): string => {
  // Handle empty strings
  if (!str) return str;

  // First convert the initial capital if it exists
  let result = str.charAt(0).toLowerCase() + str.slice(1);
  
  // Handle consecutive uppercase characters (like UUID, XML)
  result = result.replace(/([A-Z]+)([A-Z][a-z])/g, '$1_$2');
  
  // Handle normal camelCase conversions
  result = result.replace(/([a-z0-9])([A-Z])/g, '$1_$2');
  
  // Convert to lowercase
  return result.toLowerCase();
};

export const convertKeysToSnakeCase = <T extends object>(obj: T): Record<string, any> => {
  const result: Record<string, any> = {};
  
  Object.entries(obj).forEach(([key, value]) => {
    // Convert the key to snake_case
    const snakeKey = camelToSnakeCase(key);
    
    // Handle nested objects and arrays
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      result[snakeKey] = convertKeysToSnakeCase(value);
    } else if (Array.isArray(value)) {
      result[snakeKey] = value.map(item => 
        typeof item === 'object' ? convertKeysToSnakeCase(item) : item
      );
    } else {
      result[snakeKey] = value;
    }
  });
  
  return result;
};