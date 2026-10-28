import { Link, useNavigate } from 'react-router'
import { useId, useState, type SubmitEvent } from 'react'
import { useAuth } from '../../hooks/useAuth'
import teoLogo from '../../assets/teo.jfif'

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

type FieldErrors = {
    email?: string
    password?: string
}

function MailIcon() {
    return (
        <svg
            className="pointer-events-none absolute top-1/2 left-3.5 h-5 w-5 -translate-y-1/2 text-marino/55"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            aria-hidden="true"
        >
            <rect x="3" y="5" width="18" height="14" rx="2" />
            <path d="m4 7 8 6 8-6" />
        </svg>
    )
}

function LockIcon() {
    return (
        <svg
            className="pointer-events-none absolute top-1/2 left-3.5 h-5 w-5 -translate-y-1/2 text-marino/55"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            aria-hidden="true"
        >
            <rect x="5" y="11" width="14" height="10" rx="2" />
            <path d="M8 11V8a4 4 0 0 1 8 0v3" />
        </svg>
    )
}

function EyeIcon({ open }: { open: boolean }) {
    if (open) {
        return (
            <svg
                className="h-5 w-5"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                aria-hidden="true"
            >
                <path d="M3 3l18 18" />
                <path d="M10.6 10.6a2 2 0 0 0 2.8 2.8" />
                <path d="M9.9 5.1A10.8 10.8 0 0 1 12 4.8c5 0 9.3 3.1 11 7.2a12.3 12.3 0 0 1-1.7 2.9" />
                <path d="M6.6 6.6C4.2 8.2 2.5 10.4 1 12c1.7 3.2 5 6.2 11 6.2 1.3 0 2.5-.2 3.6-.5" />
            </svg>
        )
    }

    return (
        <svg
            className="h-5 w-5"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            aria-hidden="true"
        >
            <path d="M1 12s4-7.2 11-7.2S23 12 23 12s-4 7.2-11 7.2S1 12 1 12Z" />
            <circle cx="12" cy="12" r="3" />
        </svg>
    )
}

export default function Login() {
    const navigate = useNavigate()
    const { login } = useAuth()
    const [apiError, setApiError] = useState('')
    const [loading, setLoading] = useState(false)

    const emailId = useId()
    const passwordId = useId()
    const emailErrorId = useId()
    const passwordErrorId = useId()

    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [showPassword, setShowPassword] = useState(false)
    const [errors, setErrors] = useState<FieldErrors>({})
    const [submitted, setSubmitted] = useState(false)

    function validate(nextEmail = email, nextPassword = password): FieldErrors {
        const nextErrors: FieldErrors = {}
        const trimmedEmail = nextEmail.trim()

        if (!trimmedEmail) {
            nextErrors.email = 'El correo electrónico es obligatorio.'
        } else if (!EMAIL_PATTERN.test(trimmedEmail)) {
            nextErrors.email = 'Introduce un correo electrónico con un formato válido.'
        }

        if (!nextPassword) {
            nextErrors.password = 'La contraseña es obligatoria.'
        }

        return nextErrors
    }

    async function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
        event.preventDefault()
        const nextErrors = validate()
        setErrors(nextErrors)
        setSubmitted(true)

        if (Object.keys(nextErrors).length > 0) {
            return
        }

        // Ejecución de la simulacion para login
        setLoading(true)
        setApiError('')
        try {
            await login(email, password)
            navigate('/admin')
        } catch (err) {
            setApiError(err instanceof Error ? err.message : 'Error al iniciar sesión')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="relative flex min-h-svh flex-col bg-crema font-sans text-marino">
            <header className="absolute top-0 left-0 z-10 flex items-center gap-3 px-5 py-5 sm:px-8 sm:py-6">
                <Link to="/" className="flex items-center gap-3 group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#A9D6E8] rounded-xl p-1">
                    <img
                        src={teoLogo}
                        alt="Logo de Proyecto Teo"
                        className="h-12 w-12 rounded-2xl object-cover shadow-sm ring-2 ring-celeste/70 sm:h-14 sm:w-14"
                    />
                    <div>
                        <p className="font-heading text-lg font-semibold tracking-tight text-marino sm:text-xl">
                            Proyecto Teo
                        </p>
                        <p className="font-sans text-xs text-cafe sm:text-sm">Adopción responsable</p>
                    </div>
                </Link>    
            </header>

            <main className="flex flex-1 flex-col items-center justify-center px-4 py-28 sm:px-6">
                <section
                    className="w-full max-w-110 rounded-[28px] bg-white px-6 py-9 shadow-[0_18px_50px_rgba(23,38,65,0.08)] sm:px-10"
                    aria-labelledby="login-title"
                >
                    <div className="mb-8 text-center">
                        <h1
                            id="login-title"
                            className="font-heading text-[1.85rem] leading-tight font-semibold text-marino sm:text-[2rem]"
                        >
                            Bienvenido de nuevo
                        </h1>
                        <p className="mt-2 font-sans text-sm text-marino/60 sm:text-base">
                            Inicia sesión para continuar el rescate y la adopción de gatos
                        </p>
                    </div>

                    <form className="flex flex-col gap-5" onSubmit={handleSubmit} noValidate>
                        <div className="flex flex-col gap-1.5">
                            <label htmlFor={emailId} className="font-sans text-sm font-semibold text-marino">
                                Correo electrónico{' '}
                                <span className="text-cafe" aria-hidden="true">
                                    *
                                </span>
                            </label>
                            <div className="relative">
                                <MailIcon />
                                <input
                                    id={emailId}
                                    name="email"
                                    type="email"
                                    autoComplete="email"
                                    inputMode="email"
                                    required
                                    aria-required="true"
                                    aria-invalid={Boolean(errors.email)}
                                    aria-describedby={errors.email ? emailErrorId : undefined}
                                    placeholder="nombre@correo.com"
                                    value={email}
                                    onChange={(event) => {
                                        const value = event.target.value
                                        setEmail(value)
                                        if (submitted) {
                                            setErrors(validate(value, password))
                                        }
                                    }}
                                    className="h-12 w-full rounded-xl border border-beige/80 bg-white pr-4 pl-11 font-sans text-sm text-marino placeholder:text-marino/35 outline-none transition focus-visible:border-celeste focus-visible:ring-2 focus-visible:ring-celeste/70"
                                />
                            </div>
                            {errors.email ? (
                                <p id={emailErrorId} role="alert" className="font-sans text-sm text-cafe">
                                    {errors.email}
                                </p>
                            ) : null}
                        </div>

                        <div className="flex flex-col gap-1.5">
                            <label htmlFor={passwordId} className="font-sans text-sm font-semibold text-marino">
                                Contraseña{' '}
                                <span className="text-cafe" aria-hidden="true">
                                    *
                                </span>
                            </label>
                            <div className="relative">
                                <LockIcon />
                                <input
                                    id={passwordId}
                                    name="password"
                                    type={showPassword ? 'text' : 'password'}
                                    autoComplete="current-password"
                                    required
                                    aria-required="true"
                                    aria-invalid={Boolean(errors.password)}
                                    aria-describedby={errors.password ? passwordErrorId : undefined}
                                    placeholder="Tu contraseña"
                                    value={password}
                                    onChange={(event) => {
                                        const value = event.target.value
                                        setPassword(value)
                                        if (submitted) {
                                            setErrors(validate(email, value))
                                        }
                                    }}
                                    className="h-12 w-full rounded-xl border border-beige/80 bg-white pr-12 pl-11 font-sans text-sm text-marino placeholder:text-marino/35 outline-none transition focus-visible:border-celeste focus-visible:ring-2 focus-visible:ring-celeste/70"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword((visible) => !visible)}
                                    className="absolute top-1/2 right-2.5 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-lg text-marino/55 transition hover:bg-crema hover:text-marino focus-visible:ring-2 focus-visible:ring-celeste/70 focus-visible:outline-none"
                                    aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                                    aria-pressed={showPassword}
                                >
                                    <EyeIcon open={showPassword} />
                                </button>
                            </div>
                            {errors.password ? (
                                <p id={passwordErrorId} role="alert" className="font-sans text-sm text-cafe">
                                    {errors.password}
                                </p>
                            ) : null}
                        </div>

                        {apiError ? (
                            <div role="alert" className="rounded-xl bg-red-50 p-3 text-sm font-medium text-red-800 ring-1 ring-red-200">
                                {apiError}
                            </div>
                        ) : null}

                        <button
                            type="submit"
                            disabled={loading}
                            className="mt-2 h-12 rounded-2xl bg-marino font-sans text-base font-semibold text-crema transition hover:bg-marino/90 focus-visible:ring-2 focus-visible:ring-celeste focus-visible:ring-offset-2 focus-visible:outline-none disabled:opacity-70 flex items-center justify-center gap-2"
                        >
                            {loading ? 'Iniciando sesión...' : 'Iniciar sesión'}
                        </button>
                    </form>
                </section>
            </main>

            <footer className="pb-6 text-center font-sans text-xs text-marino/55 sm:text-sm">
                Proyecto Teo · Cada gato merece un hogar
            </footer>
        </div>
    )
}
