export function isAdmin(request) {
  const expected = process.env.ADMIN_PIN || "";
  const provided = request.headers.get("x-pin") || "";
  return expected.length > 0 && provided === expected;
}

export function forbiddenResponse() {
  return Response.json(
    { error: "Falsche PIN oder keine Berechtigung." },
    { status: 403 }
  );
}
