/**
 * Template Variable Engine
 *
 * Extracts and substitutes {{variable}} placeholders in template text.
 *
 * Usage:
 *   TemplateEngine.extractVariables("Hi {{name}}, you have {{points}} points")
 *   // => ["name", "points"]
 *
 *   TemplateEngine.substitute("Hi {{name}}", { name: "John" })
 *   // => "Hi John"
 */
export class TemplateEngine {
  /**
   * Extract all variables from template text
   * E.g., "Hi {{name}}, you have {{points}} points" -> ["name", "points"]
   */
  static extractVariables(text: string): string[] {
    const regex = /\{\{(\w+)\}\}/g;
    const matches: string[] = [];
    let match;

    while ((match = regex.exec(text)) !== null) {
      matches.push(match[1]);
    }

    return [...new Set(matches)]; // Remove duplicates
  }

  /**
   * Substitute variables in template
   * E.g., substitute("Hi {{name}}", { name: "John" }) -> "Hi John"
   */
  static substitute(text: string, variables: Record<string, string>): string {
    let result = text;

    for (const [key, value] of Object.entries(variables)) {
      const regex = new RegExp(`\\{\\{${key}\\}\\}`, 'g');
      result = result.replace(regex, value || '');
    }

    return result;
  }

  /**
   * Check if template text has proper variable format
   */
  static hasValidVariables(text: string): boolean {
    return /\{\{(\w+)\}\}/.test(text);
  }
}
