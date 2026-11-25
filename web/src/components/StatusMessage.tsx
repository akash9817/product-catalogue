export function Loading({ label = "Loading..." }: { label?: string }) {
  return <p className="status status--loading" role="status">{label}</p>;
}

export function ErrorMessage({ message }: { message: string }) {
  return (
    <p className="status status--error" role="alert">
      {message}
    </p>
  );
}
