import { Appbar, useTheme } from "react-native-paper";

export default function Header({ title }: { title: string }) {
  const theme = useTheme();

  return (
    <Appbar.Header style={{ backgroundColor: theme.colors.surface }}>
      <Appbar.Content
        title={title}
        titleStyle={{ fontSize: 20, fontWeight: "700" }}
      />
    </Appbar.Header>
  );
}
