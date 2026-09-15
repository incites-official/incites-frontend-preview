export function formatStudentAge(age: number | null | undefined): string {
  return age == null ? "나이 미등록" : `${age}세`;
}
