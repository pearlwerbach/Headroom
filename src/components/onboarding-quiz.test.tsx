import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { OnboardingQuiz } from "@/components/onboarding-quiz";

vi.mock("@/app/actions/onboarding", () => ({
  submitOnboardingAction: vi.fn(async () => ({ status: "idle" })),
}));

describe("OnboardingQuiz", () => {
  it("advances once an answer is selected", async () => {
    const user = userEvent.setup();
    render(<OnboardingQuiz />);

    expect(screen.getByText(/question 1 of 10/i)).toBeInTheDocument();
    expect(screen.getByText(/responses inform your planning profile\./i)).toBeInTheDocument();
    expect(
      screen.getByText(
        /what kind of work block usually gives you the best output on demanding work\?/i,
      ),
    ).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /20-40 minute bursts/i }));

    expect(
      screen.getByText(
        /when your day is broken into short gaps, how usable are those gaps for meaningful work\?/i,
      ),
    ).toBeInTheDocument();
  });
});
