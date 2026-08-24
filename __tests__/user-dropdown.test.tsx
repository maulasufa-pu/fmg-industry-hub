import { render, screen } from "@testing-library/react";
import UserDropdown from "@/app/ui/pop_over/user_dropdown";

jest.mock("next-themes", () => ({
  useTheme: () => ({ theme: "light", setTheme: jest.fn() }),
}));

jest.mock("@/app/auth/LogoutButton", () => ({
  __esModule: true,
  default: ({ children }: { children: React.ReactNode }) => <button>{children}</button>,
}));

describe("UserDropdown", () => {
  it("renders the profile supplied by its parent without loading another profile hook", () => {
    render(
      <UserDropdown
        isOpen
        onClose={jest.fn()}
        loading={false}
        profile={{
          id: "admin-id",
          fullName: "Super Admin",
          email: "admin@example.com",
          role: "admin",
          avatarPath: null,
          avatarUrl: null,
        }}
      />,
    );

    expect(screen.getByText("Super Admin")).toBeInTheDocument();
    expect(screen.getByText("Admin Hub")).toBeInTheDocument();
  });
});
