import { promises as fs } from "fs";
import { resolve, join, normalize, relative } from "path";
import isValidPath from "./_utils/isValidPath.js";
import { CONTROL_CHARS } from "./_utils/variables.js";
import processLine from "./_utils/processLine.js";
import detectType from "./_utils/detectType.js";

async function generateTemplate(inputDir: string): Promise<void> {
  const safePath = isValidPath(inputDir);
  if (!safePath) {
    console.error(`❌ Небезопасный путь`);
    process.exit(1);
  }

  const basePath = resolve(process.cwd(), safePath);
  const envPath = join(basePath, ".env");
  const templatePath = join(basePath, ".env.example");

  try {
    // Параллельная проверка директории и чтение файла
    const [dirStats, fileContent] = await Promise.all([
      fs.stat(basePath).catch(() => null),
      fs.readFile(envPath, "utf8").then((content) => {
        // Быстрая проверка размера в памяти
        if (content.length > 1048576) throw new Error("FILE_TOO_LARGE");
        return content;
      }),
    ]);

    if (!dirStats?.isDirectory()) {
      console.error(`❌ ${safePath} не является директорией`);
      process.exit(1);
    }

    // Быстрая обработка без лишних операций
    const lines = fileContent.replace(CONTROL_CHARS, "").split(/\r?\n/);
    const result: string[] = [];
    const commentBuffer: string[] = [];

    // Add a header explaining the types

    const header = `# |-=-=-=|
	# This file was generated automatically by Tomorrow
	# |-=-=-=|
	# !Note! that this is a template for your .env file for the application to work correctly.
	# All fields use the following syntax
	# <VARIABLE_NAME>=<TYPE>
	# |-=-=-=|
	`;

    result.push(header);

    // Оптимизированный цикл
    const maxLines = Math.min(lines.length, 10000);
    for (let i = 0; i < maxLines; i++) {
      const processed = processLine(lines[i]);

      if (!processed.isValid) {
        if (!processed.isComment) commentBuffer.length = 0;
        continue;
      }

      if (processed.isComment) {
        // Сохраняем комментарии с кириллицей
        const cleanComment = lines[i].replace(
          /[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g,
          ""
        );
        commentBuffer.push(cleanComment);
        continue;
      }

      // Обработка переменной
      if (commentBuffer.length) {
        result.push(...commentBuffer);
        commentBuffer.length = 0;
      }

      result.push(`${processed.key}=${detectType(processed.key!)}`);
    }

    const output = result.join("\n") + "\n";

    // Быстрая проверка размера результата
    if (output.length > 1048576) {
      console.error(`❌ Результат слишком большой`);
      process.exit(1);
    }

    // Асинхронная запись без блокировки
    await fs.writeFile(templatePath, output, {
      encoding: "utf8",
      mode: 0o644,
    });

    console.log(`✅ .env.template создан в ${safePath}`);
  } catch (error: any) {
    // Быстрая обработка ошибок
    const code = error?.code;
    if (code === "ENOENT") {
      console.error(`❌ Файл .env не найден`);
    } else if (code === "EACCES") {
      console.error(`❌ Нет прав доступа`);
    } else if (error?.message === "FILE_TOO_LARGE") {
      console.error(`❌ Файл слишком большой`);
    } else {
      console.error(`❌ Ошибка обработки`);
    }
    process.exit(1);
  }
}

// Быстрая обработка аргументов
const inputArg = (() => {
  const arg = process.argv[2];
  if (!arg || arg.length > 255) return ".";
  return arg;
})();

export { inputArg };
export default generateTemplate(inputArg);
