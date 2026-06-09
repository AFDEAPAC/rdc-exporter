# Go Coding Style

This document defines the coding style rules for writing and modifying Go code in this project. It applies to all developers and AI agents.

This document is compiled from the Google Go Style documents, with this project's practice as the standard:

- [Go Style overview](https://google.github.io/styleguide/go/)
- [Go Style Guide](https://google.github.io/styleguide/go/guide)
- [Go Style Decisions](https://google.github.io/styleguide/go/decisions)
- [Go Style Best Practices](https://google.github.io/styleguide/go/best-practices)

## Core Principles

Go code must satisfy the following goals in priority order, and the order must not be reversed:

1. Clarity: the reader can understand what the program does and why it does it that way.
2. Simplicity: use the smallest mechanism sufficient to meet the requirement, avoiding cleverness and unnecessary abstraction.
3. Conciseness: keep high-signal content and remove duplicated naming, duplicated logic, and noise.
4. Maintainability: let future modifiers evolve the program correctly and safely.
5. Consistency: follow Go community conventions, Google Go Style, and the existing style of the same package.

When rules conflict, prefer the clearer and more maintainable approach.

## Formatting and Naming

- All Go files must be formatted with `gofmt`; imports should be organized with `goimports` or an equivalent tool.
- Multi-word names use `MixedCaps` or `mixedCaps`, never snake_case. Exceptions include test, benchmark, and example function names in `*_test.go`.
- Package names must be short, all lowercase, and must not use underscores; avoid names without clear domain meaning such as `util`, `common`, `helper`, and `model`.
- Exported identifiers start with an uppercase letter; unexported identifiers start with a lowercase letter.
- Initialisms and acronyms must keep consistent casing, for example `URL`, `urlPony`, `userID`, `dbClient`, and must not be written as `Url` or `Id`.
- Receiver names should be short and consistent, usually an abbreviation of the type, for example `func (s *Server)`; do not use `this` or `self`.
- Getters do not use the `Get` prefix unless the concept itself is a get. The return name may use a noun directly, for example `Config.Path()`; when it may block or make a remote call, `Fetch`, `Load`, or `Compute` may be used.
- Variable name length should be proportional to scope. Small scopes may use `i`, `r`, `w`, `ctx`; when spanning multiple lines or concepts, a more explicit name must be used.
- Avoid repeating in a name the information already expressed by the package, receiver, type, or parameter.

## Comments and Documentation

This project requires that "necessary comments must be written". Comments are not decoration; they are part of the API contract and maintenance knowledge.

Comments that merely restate the identifier name, the kind of type, or the surface action of the code are unacceptable. Such comments are treated as missing documentation even if they pass lint. For example, `// Service coordinates services.`, `// Config stores config.`, and `// Save saves user.` are not valid comments.

A valid comment must at least supply information that the reader cannot safely infer from the name and type alone: responsibility boundaries, caller obligations, error semantics, data consistency assumptions, lifecycle, compatibility constraints, or why a certain trade-off was made.

### Situations That Require Comments

- All exported packages, types, interfaces, funcs, methods, consts, and vars must have a doc comment.
- The package comment must be placed directly above the `package` declaration; if the content is long, it may be placed in `doc.go`.
- Unexported types, functions, methods, consts, and vars must also be commented whenever their behavior, purpose, or constraints are not intuitive.
- Even when not exported, a use case, repository interface, transaction boundary, HTTP handler adapter, config loader, database connector, token issuer, route guard, long-running worker, or anything crossing a component/shared package boundary must also have comments of maintenance value.
- Any business rule, authorization decision, data consistency assumption, performance trade-off, compatibility consideration, or special edge case must be explained in a comment.
- If an API involves context cancellation, concurrency safety, resource cleanup, error sentinels, a specific error type, callback lifetime, or goroutine lifetime, the contract must be explained in the doc comment.
- Ignoring an error, intentionally using the blank identifier, atypical conditionals, complex type conversions, or code that is easy to misread must be explained with an inline note about the reason.
- When involving JWT/access token/refresh token, password or credential storage, API token secrets, admin/current-user authorization, database transactions, migrations, config default/override, resource cleanup, goroutine lifecycle, or cross-component shared infrastructure, the security assumptions and maintenance constraints must be commented.

### Minimum Review Standard for Doc Comments

The doc comments of exported APIs and important internal boundaries must be able to answer the questions relevant to that symbol. Not every symbol needs to answer every question, but a missing relevant answer is treated as insufficient documentation.

- Responsibility boundary: what this type/function/interface is responsible for, and what it is not.
- Caller obligations: what preconditions, permissions, context, transaction, or cleanup the caller must provide.
- Error semantics: which domain/application errors are returned, which errors are retryable, and which errors indicate a permission issue or that data does not exist.
- Data consistency: whether a transaction is required, whether it reads from or writes to a durable database, and whether only a test fake or in-memory implementation is allowed.
- Resource lifecycle: whether it holds a connection, goroutine, file, timer, lock, or subscription, and when it is released.
- Concurrency and context: whether it can be used concurrently, and whether it respects context cancellation/deadline.
- Compatibility and security: which behaviors are part of the API contract, a security boundary, or something a future migration must not break arbitrarily.

### Clean Architecture Layered Comment Standard

- Entity/domain type: comments must describe the domain meaning, invariants, and allowed/disallowed states, and must not merely describe DB columns or JSON shape.
- Use case/application service: comments must describe the application flow, port dependencies, transaction expectations, authorization assumptions, and the semantics of the returned errors.
- Interface adapter: comments must describe how the external contract maps to the inner-layer model, including the boundaries of HTTP status, DTO, database row, message payload, or error mapping.
- Framework/driver/infrastructure: comments must describe the operational assumptions of config source, resource lifecycle, startup/shutdown, database/migration, network, secret, or external dependency.
- Shared internal package: comments must describe which components may depend on it, which behaviors are the shared contract, and the constraint that component-specific rules must not be placed in it.

### How to Write Comments

- A doc comment must be a complete sentence, usually beginning with the identifier being described.
- A comment should explain the why, contract, assumptions, and edge cases, not restate the what that the code already expresses clearly.
- Comments must be updated in sync with the code; a stale comment is treated as a bug.
- Comment lines have no hard length limit, but should wrap to an easily readable width and stay consistent within the same file.
- Godoc content uses blank lines to separate paragraphs; example code should preferably go in `Example...` tests, and only be placed in comments when necessary.
- A short inline note on a struct field may use a phrase, but a doc comment describing a public API must be complete.

```go
// UserStore persists and loads users for the Conductor control plane.
//
// Implementations must be safe for concurrent use and must preserve User
// capability changes atomically with profile updates. Callers should treat
// ErrUserNotFound as a domain miss, not as an infrastructure failure.
// Production implementations must use durable storage; in-memory
// implementations are limited to tests.
type UserStore interface {
	Find(ctx context.Context, id string) (*User, error)
	Save(ctx context.Context, user *User) error
}

// Find returns the user for id.
//
// Find respects context cancellation before starting database work and while
// waiting for the repository implementation. If no user exists, Find returns
// ErrUserNotFound. Other errors should wrap the infrastructure cause so the
// caller can distinguish missing data from unavailable storage.
func (s *UserStore) Find(ctx context.Context, id string) (*User, error) {
	// ...
}
```

Unacceptable comments:

```go
// Service coordinates Conductor M0 use cases.
type Service struct {
	store Store
}

// Save saves the user.
func Save(ctx context.Context, user User) error {
	// ...
}
```

Writing comments with maintenance value:

```go
// Service coordinates Conductor use cases without depending on HTTP, SQL, or
// process-level configuration.
//
// Service owns authorization and application error semantics. Database
// transactions, JWT signing, and clock access are supplied through ports so
// use cases can be tested without starting external systems.
type Service struct {
	store Store
}

// Keep one worker alive during shutdown so queued audit events can flush before
// the process releases its database connection.
workers := 1
```

## Error Handling

- A function that can fail should return an `error`, and the `error` must be the last return value.
- The caller must explicitly handle an error, wrap and return it, or in rare cases terminate the flow; it must not be silently discarded.
- If a certain error is determined to never occur, the reason must be noted when it is ignored.
- Error strings do not start with a capital letter and do not end with a period, unless they begin with a proper noun or an exported name.
- When wrapping an error, add context that helps with localization; use `%w` when the original error semantics need to be preserved.
- Do not use a magic value to indicate an error; return `(value, ok)` or `(value, error)` instead.
- Handle errors and terminal conditions first, then keep the normal flow on the main path, avoiding unnecessary `else` nesting.

```go
user, err := store.Find(ctx, id)
if err != nil {
	return nil, fmt.Errorf("find user %q: %w", id, err)
}

return user, nil
```

## API and Language Usage

- Prefer Go's core language mechanisms and the standard library; only add a dependency or abstraction when the requirement is clear.
- Do not create premature interfaces for tests or imagined futures. Interfaces should be defined by the consuming side and must have a clear contract.
- Before using generics, confirm that they reduce duplication or improve type safety; do not abstract just for the sake of abstraction.
- When creating a struct literal of a type from an external package, field names must be used to avoid coupling to field order.
- The closing brace of a multi-line literal must be aligned on its own line; let `gofmt` decide the indentation.
- When returning an empty collection, prefer a nil slice unless the API contract requires a non-nil slice.
- Do not use `panic` to handle ordinary errors; `panic` may only be used for unrecoverable programmer errors or states that cannot continue during initialization.
- Code that starts a goroutine must clearly explain its lifecycle, stop condition, and error handling.
- Context should be passed as the first parameter and named `ctx`; it must not be stored in a struct as long-lived state unless the API contract explicitly requires it and it is commented.

## Imports and Package Organization

- Imports should be grouped into standard library, third party, and this project's packages, and sorted by `goimports`.
- Avoid import renames; use them only to avoid conflicts, for generated packages, for conventional abbreviations, or to improve readability.
- Dot imports are forbidden, except in the rare test scenario where they clearly improve readability.
- Blank imports must be annotated with their purpose, for example registering a driver or enabling a side effect.
- A package should focus on a single domain; if its name becomes vague, it usually means the boundary needs to be reorganized.

## Testing Rules

- Tests must verify behavior and should not merely copy implementation details.
- Multi-case tests should prefer table-driven tests; case names should describe the behavioral difference.
- When using subtests, the name must be able to locate the failing scenario.
- Test error messages use `got` before `want`, and include actionable information such as the input, scenario, or function name.
- A test helper must call `t.Helper()`, and either return an error or report the failure in the same goroutine.
- When comparing complex structures, use a stable, readable diff; avoid relying on unstable ordering.
- Test data and setup should be confined to the test scope that needs them as much as possible, avoiding shared mutable state across tests.

```go
for _, tc := range tests {
	t.Run(tc.name, func(t *testing.T) {
		got, err := Parse(tc.input)
		if err != nil {
			t.Fatalf("Parse(%q) returned error: %v", tc.input, err)
		}
		if got != tc.want {
			t.Errorf("Parse(%q) = %q, want %q", tc.input, got, tc.want)
		}
	})
}
```

## Agent Execution Rules

When an AI agent modifies Go code, it must follow these rules:

- Read the existing style of neighboring packages first, then make modifications.
- When adding an exported API, the doc comment must be added at the same time, not left for lint or the reviewer to fill in.
- When modifying an API contract, error semantics, concurrency behavior, resource lifecycle, or context behavior, the comments and tests must be updated synchronously.
- If the code requires a complex approach, simplification must be attempted first; when it cannot be simplified, explain the necessary reason in a comment.
- Formulaic comments, identifier summary comments, and comments describing only the `what` are treated as non-compliant; the contract, assumption, boundary, or why must be supplied.
- When adding a use case, adapter, infrastructure, shared internal package, or config/database/auth/token/security-related code, first confirm whether the comments meet the minimum review standard of this document.
- Do not pad with large amounts of low-value comments; comments must help future readers avoid misuse or mismodification.
- Do not introduce abstractions, naming, or test tooling inconsistent with this package's style, unless the modification itself is for unifying the style.
- Before completing a modification, run or recommend running the related tests and formatting tools.
