/**
 * Constants for GitHub API and service configuration
 */

// Dependabot Supported Languages (https://docs.github.com/en/get-started/learning-about-github/github-language-support)
export const DEPENDABOT_SUPPORTED_LANGUAGES = [
  "C#",
  "Go",
  "Java",
  "JavaScript",
  "Kotlin",
  "PHP",
  "Python",
   "Ruby",
  "Rust",
  "Scala",
  "Swift",
  "TypeScript",
] as const;

// Veracode Supported Languages (https://docs.veracode.com/r/r_supported_table)
export const VERACODE_SUPPORTED_LANGUAGES = [
  "Java",
  "C#",
  "VB.NET",
  "C++",
  "JavaScript",
  "TypeScript",
  "PHP",
  "Scala",
  "Groovy",
  "Kotlin",
  "Dart",
  "Ruby",
  "Apex",
  "PLSQL",
  "TSQL",
  "Perl",
  "Python",
  "Go",
  "C",  
  "COBOL"
] as const;

export const TRIVY_REQUIRED_LANGUAGES = ['HCL'] as const;
