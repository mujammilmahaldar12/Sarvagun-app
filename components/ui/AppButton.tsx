import { Button } from "react-native-paper";

export default function AppButton({ title, onPress }: any) {
  return (
    <Button
      mode="contained"
      onPress={onPress}
      style={{
        marginVertical: 10,
        borderRadius: 12,
        width: "90%",
        alignSelf: "center",
      }}
      contentStyle={{
        paddingVertical: 10,
        borderRadius: 12,
      }}
      labelStyle={{
        fontSize: 16,
        fontWeight: "600",
      }}
    >
      {title}
    </Button>
  );
}
