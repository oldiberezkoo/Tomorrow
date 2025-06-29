import { Spinner } from "cli-spinner";
import chalk from "chalk";

// Типы для спиннера
export type SpinnerOptions = {
  text?: string;
  color?:
    | "black"
    | "red"
    | "green"
    | "yellow"
    | "blue"
    | "magenta"
    | "cyan"
    | "white";
  spinnerType?: SpinnerType;
  hideCursor?: boolean;
  indent?: number;
};

export type SpinnerType =
  | "dots"
  | "dots2"
  | "dots3"
  | "dots4"
  | "dots5"
  | "dots6"
  | "dots7"
  | "dots8"
  | "dots9"
  | "dots10"
  | "dots11"
  | "dots12"
  | "line"
  | "pipe"
  | "simpleDots"
  | "simpleDotsScrolling"
  | "star"
  | "flip"
  | "custom";

export interface SpinnerInstance {
  start: (text?: string) => void;
  stop: (success?: boolean, text?: string) => void;
  update: (text: string) => void;
  succeed: (text?: string) => void;
  fail: (text?: string) => void;
  warn: (text?: string) => void;
}

// Фабрика спиннеров
export const spinnerFactory = (
  initialText: string,
  options: SpinnerOptions = {}
): SpinnerInstance => {
  const {
    color = "cyan",
    spinnerType = "dots",
    hideCursor = true,
    indent = 2,
  } = options;

  let spinner: Spinner | null = null;
  let isRunning = false;
  let lastMessage = initialText;

  // Цвета для статусов
  const statusColors = {
    success: chalk.green,
    error: chalk.red,
    warning: chalk.yellow,
    info: chalk.blue,
  };

  // Инициализация спиннера
  const initSpinner = () => {
    if (spinner) return;

    spinner = new Spinner({
      text: `${" ".repeat(indent)}${lastMessage}`,
      stream: process.stdout,
      onTick: function (msg: string) {
        // Fix: cursorTo is not a method of Spinner, use process.stdout.cursorTo if available
        if (typeof process.stdout.cursorTo === "function") {
          process.stdout.clearLine(0);
          process.stdout.cursorTo(0);
        } else {
          // Fallback: clear line with ANSI escape and move to start
          process.stdout.write('\r\x1b[K');
        }
        this.stream.write(msg);
      },
    });

    // Настройка стиля
    spinner.setSpinnerString(getSpinnerString(spinnerType));
    spinner.setSpinnerTitle(` %s `);

    if (color) {
      const spinnerColor = chalk[color] || chalk.cyan;
      spinner.setSpinnerString(spinnerColor(getSpinnerString(spinnerType)));
    }

    if (hideCursor) {
      process.stdout.write("\x1B[?25l"); // Скрыть курсор
    }
  };

  // Получение символов для спиннера
  const getSpinnerString = (type: SpinnerType): string => {
    const spinnerMap: Record<string, string> = {
      dots: "⠋⠙⠹⠸⠼⠴⠦⠧⠇⠏",
      dots2: "⣾⣽⣻⢿⡿⣟⣯⣷",
      dots3: "⠁⠂⠄⡀⢀⠠⠐⠈",
      line: "-\\|/",
      pipe: "┤┘┴└├┌┬┐",
      simpleDots: ".  ..   ...      ....",
      star: "✶✸✹✺✹✷",
      flip: "___-``-''\"\"--___",
      custom: "◐◓◑◒",
    };

    return spinnerMap[type] || spinnerMap.dots;
  };

  // Методы API спиннера
  const api: SpinnerInstance = {
    start: (text = lastMessage) => {
      if (isRunning) return;
      lastMessage = text;
      initSpinner();
      spinner!.start();
      isRunning = true;
    },

    stop: (success = true, text = lastMessage) => {
      if (!isRunning || !spinner) return;

      spinner.stop(true);
      if (text) {
        const status = success
          ? statusColors.success("✔")
          : statusColors.error("✖");
        process.stdout.write(`${" ".repeat(indent)}${status} ${text}\n`);
      }

      cleanup();
    },

    update: (text: string) => {
      lastMessage = text;
      if (spinner && isRunning) {
        spinner.setSpinnerTitle(`${" ".repeat(indent)}%s ${text}`);
      }
    },

    succeed: (text = lastMessage) => {
      api.stop(true, text);
      process.stdout.write(
        `${" ".repeat(indent)}${statusColors.success("✔")} ${text}\n`
      );
    },

    fail: (text = lastMessage) => {
      api.stop(false, text);
      process.stdout.write(
        `${" ".repeat(indent)}${statusColors.error("✖")} ${text}\n`
      );
    },

    warn: (text = lastMessage) => {
      api.stop(true, text);
      process.stdout.write(
        `${" ".repeat(indent)}${statusColors.warning("⚠")} ${text}\n`
      );
    },
  };

  // Очистка ресурсов
  const cleanup = () => {
    if (hideCursor) {
      process.stdout.write("\x1B[?25h"); // Показать курсор
    }
    spinner = null;
    isRunning = false;
  };

  // Автоматическая очистка при завершении процесса
  process.on("exit", () => {
    if (isRunning) {
      spinner?.stop(true);
      cleanup();
    }
  });

  return api;
};

// Вспомогательная функция для создания префикса
export const withSpinner = async <T>(
  text: string,
  action: (spinner: SpinnerInstance) => Promise<T>,
  options?: SpinnerOptions
): Promise<T> => {
  const spinner = spinnerFactory(text, options);
  spinner.start();

  try {
    const result = await action(spinner);
    spinner.succeed();
    return result;
  } catch (error) {
    spinner.fail(`${text} failed: ${(error as Error).message}`);
    throw error;
  }
};
