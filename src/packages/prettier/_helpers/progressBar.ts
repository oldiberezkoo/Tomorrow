interface ProgressState {
  current: number;
  total: number;
  message: string;
}

export function createProgressBar(): {
  start: (total: number, message: string) => void;
  increment: (message?: string) => void;
  finish: (message?: string) => void;
} {
  const state: ProgressState = { current: 0, total: 0, message: "" };

  function render(): void {
    const percent = Math.floor((state.current / state.total) * 100);
    const bar =
      "█".repeat(Math.floor(percent / 2)) +
      "░".repeat(50 - Math.floor(percent / 2));
    process.stdout.write(`\r[${bar}] ${percent}% ${state.message}`);
  }

  return {
    start(total: number, message: string): void {
      state.total = total;
      state.current = 0;
      state.message = message;
      render();
    },

    increment(message?: string): void {
      state.current++;
      if (message) state.message = message;
      render();
    },

    finish(message?: string): void {
      state.current = state.total;
      if (message) state.message = message;
      render();
      console.log(); // New line
    },
  };
}
