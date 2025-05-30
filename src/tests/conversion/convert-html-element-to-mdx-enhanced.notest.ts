import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import fs from 'fs/promises';
import path from 'path';
import { exec } from 'child_process';
import util from 'util';

const execPromise = util.promisify(exec);

// Resolve paths relative to this test file's directory
const projectRoot = path.resolve(__dirname, '../../../'); // Assumes src/tests/conversion
const scriptPath = path.resolve(projectRoot, 'scripts/convert-html-element-to-mdx-enhanced.mjs');
const fixturesBasePath = path.resolve(projectRoot, 'src/tests/fixtures/elements'); // Updated base path for fixtures
const tempOutputDir = path.resolve(projectRoot, 'src/tests/fixtures/temp-output'); // Temp output in fixtures for simplicity during testing

describe('convert-html-element-to-mdx-enhanced Script', () => {
  beforeAll(async () => {
    await fs.mkdir(tempOutputDir, { recursive: true });
  });

  afterAll(async () => {
    await fs.rm(tempOutputDir, { recursive: true, force: true });
  });

  const testCases = [
    {
      inputFile: '1025.html', // Relative to fixturesBasePath (src/tests/fixtures/elements)
      expectedOutputFile: '1025.expected.mdx', // Relative to fixturesBasePath
      description: 'should convert 1025.html to the expected MDX output',
    },
    // Add more test cases here if needed, following the same structure
    // e.g.,
    // {
    //   inputFile: 'another-element.html',
    //   expectedOutputFile: 'another-element.expected.mdx',
    //   description: 'should convert another-element.html correctly',
    // },
  ];

  for (const { inputFile, expectedOutputFile, description } of testCases) {
    it(description, async () => {
      const inputFilePath = path.join(fixturesBasePath, inputFile);
      const expectedOutputFilePath = path.join(fixturesBasePath, expectedOutputFile);
      // Place actual output in a temporary directory to avoid cluttering fixtures
      const actualOutputFileName = inputFile.replace('.html', '.output.mdx');
      const actualOutputFilePath = path.join(tempOutputDir, actualOutputFileName);

      try {
        await fs.access(inputFilePath);
      } catch (error) {
        throw new Error(`Fixture input file not found: ${inputFilePath}. Please ensure it exists.`);
      }
      
      try {
        await fs.access(expectedOutputFilePath);
      } catch (error) {
        throw new Error(`Fixture expected output file not found: ${expectedOutputFilePath}. Please ensure it exists.`);
      }

      try {
        const { stdout, stderr } = await execPromise(`node "${scriptPath}" "${inputFilePath}" "${actualOutputFilePath}"`);

        if (stderr) {
          // Log stderr for debugging, but don't fail solely on stderr unless an error is indicated
          // Some scripts might output warnings to stderr without it being a failure.
          console.warn(`Stderr for ${inputFile}: ${stderr}`);
        }

        const actualMdx = await fs.readFile(actualOutputFilePath, 'utf-8');
        const expectedMdx = await fs.readFile(expectedOutputFilePath, 'utf-8');

        // Save a debug copy of the output for inspection
        const debugOutputPath = path.join(tempOutputDir, `${inputFile}.debug.output.mdx`);
        await fs.writeFile(debugOutputPath, actualMdx);
          
        // Normalize line endings before comparison
        const normalizedActual = actualMdx.replace(/\r\n/g, '\n').trim();
        const normalizedExpected = expectedMdx.replace(/\r\n/g, '\n').trim();
        
        // For more precise debugging, we'll compare the content line by line
        const actualLines = normalizedActual.split('\n');
        const expectedLines = normalizedExpected.split('\n');
        
        // Check if the number of lines is the same
        if (actualLines.length !== expectedLines.length) {
          console.warn(`Line count mismatch: Expected ${expectedLines.length} lines, got ${actualLines.length} lines`);
        }
        
        // Find the first line that doesn't match
        let firstMismatchFound = false;
        for (let i = 0; i < Math.min(actualLines.length, expectedLines.length); i++) {
          if (actualLines[i] !== expectedLines[i] && !firstMismatchFound) {
            console.warn(`First mismatch at line ${i+1}:`);
            console.warn(`Expected: "${expectedLines[i]}"`);
            console.warn(`Actual:   "${actualLines[i]}"`);
            firstMismatchFound = true;
          }
        }
        
        // Still check equality for test to pass/fail
        expect(normalizedActual).toEqual(normalizedExpected);
      } finally {
        // Optional: Clean up individual actual output file if not using afterAll
        // await fs.unlink(actualOutputFilePath).catch(() => {});
      }
    });
  }

  it('should throw an error for a non-existent input file', async () => {
    const nonExistentInputFile = path.join(fixturesBasePath, 'nonexistent-input.html');
    const dummyOutputFile = path.join(tempOutputDir, 'nonexistent.output.mdx');

    await expect(
      execPromise(`node "${scriptPath}" "${nonExistentInputFile}" "${dummyOutputFile}"`)
    ).rejects.toThrow(); 
    // You can make this more specific by checking the error message in stderr if the script has consistent error output.
    // e.g., .rejects.toThrow(/Input file not found/);
  });

  it('should throw an error for an empty input HTML file', async () => {
    const emptyInputFile = path.join(tempOutputDir, 'empty.html');
    const dummyOutputFile = path.join(tempOutputDir, 'empty.output.mdx');
    
    await fs.writeFile(emptyInputFile, ''); // Create an empty file for this test case

    try {
      // Expect the script to fail (exit with a non-zero code or produce a specific error)
      await expect(
        execPromise(`node "${scriptPath}" "${emptyInputFile}" "${dummyOutputFile}"`)
      ).rejects.toThrow();
      // If the script exits with 0 but logs to stderr and doesn't create a valid output,
      // you might need to adjust this to check stderr or the absence/content of the output file.
    } finally {
      // Clean up the temporary empty file (though afterAll will get it too)
      // await fs.unlink(emptyInputFile).catch(() => {});
    }
  });
});