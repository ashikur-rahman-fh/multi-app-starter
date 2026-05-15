export function ErrorState({ message }: { message: string }) {
  return (
    <p role="alert" style={{ color: 'crimson' }}>
      {message}
    </p>
  );
}
