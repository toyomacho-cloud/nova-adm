'use client'

import { useState } from 'react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Badge } from '@/components/ui/Badge'
import {
    Users,
    Plus,
    Search,
    Edit,
    Trash2,
    Shield,
    Eye,
    EyeOff,
    Lock,
    Mail,
    User,
    CheckCircle2,
    XCircle,
    AlertTriangle,
} from 'lucide-react'

export default function UsuariosPage() {
    const [searchTerm, setSearchTerm] = useState('')
    const [showModal, setShowModal] = useState(false)
    const [selectedUser, setSelectedUser] = useState<any>(null)
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
    const [userToDelete, setUserToDelete] = useState<any>(null)
    const [isDeleting, setIsDeleting] = useState(false)
    const [deleteMessage, setDeleteMessage] = useState('')

    const handleDeleteClick = (user: any) => {
        setUserToDelete(user)
        setShowDeleteConfirm(true)
        setDeleteMessage('')
    }

    const confirmDelete = async () => {
        if (!userToDelete) return

        setIsDeleting(true)
        try {
            const response = await fetch(`/api/users?id=${userToDelete.id}`, {
                method: 'DELETE',
            })

            const data = await response.json()

            if (response.ok) {
                setDeleteMessage('Usuario eliminado correctamente')
                // Reload page to refresh list
                setTimeout(() => {
                    window.location.reload()
                }, 1000)
            } else {
                setDeleteMessage(data.error || 'Error al eliminar usuario')
            }
        } catch (error) {
            setDeleteMessage('Error de conexión')
        } finally {
            setIsDeleting(false)
        }
    }

    return (
        <div className="space-y-6 animate-in">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-display font-bold mb-2">Gestión de Usuarios</h1>
                    <p className="text-gray-600 dark:text-gray-400">
                        Administra usuarios, roles y permisos de acceso
                    </p>
                </div>

                <Button
                    variant="primary"
                    size="lg"
                    onClick={() => {
                        setSelectedUser(null)
                        setShowModal(true)
                    }}
                >
                    <Plus className="w-5 h-5 mr-2" />
                    Nuevo Usuario
                </Button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <Card variant="glass">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                                Total Usuarios
                            </p>
                            <h3 className="text-2xl font-bold">12</h3>
                        </div>
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center text-white">
                            <Users className="w-6 h-6" />
                        </div>
                    </div>
                </Card>

                <Card variant="glass">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                                Activos
                            </p>
                            <h3 className="text-2xl font-bold">10</h3>
                        </div>
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-success-500 to-success-600 flex items-center justify-center text-white">
                            <CheckCircle2 className="w-6 h-6" />
                        </div>
                    </div>
                </Card>

                <Card variant="glass">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                                Inactivos
                            </p>
                            <h3 className="text-2xl font-bold">2</h3>
                        </div>
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-danger-500 to-danger-600 flex items-center justify-center text-white">
                            <XCircle className="w-6 h-6" />
                        </div>
                    </div>
                </Card>

                <Card variant="glass">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                                Administradores
                            </p>
                            <h3 className="text-2xl font-bold">3</h3>
                        </div>
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-secondary-500 to-secondary-600 flex items-center justify-center text-white">
                            <Shield className="w-6 h-6" />
                        </div>
                    </div>
                </Card>
            </div>

            {/* Search */}
            <Card variant="glass">
                <Input
                    placeholder="Buscar por nombre, email..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    icon={<Search className="w-5 h-5" />}
                />
            </Card>

            {/* Users Table */}
            <Card variant="glass">
                <div className="overflow-x-auto">
                    <table className="table-modern">
                        <thead>
                            <tr>
                                <th>Usuario</th>
                                <th>Email</th>
                                <th>Rol</th>
                                <th>Estado</th>
                                <th>Último Acceso</th>
                                <th className="text-right">Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {users.map((user, index) => (
                                <tr key={index}>
                                    <td>
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-500 to-secondary-500 flex items-center justify-center text-white font-semibold">
                                                {user.name.charAt(0)}
                                            </div>
                                            <div>
                                                <div className="font-medium">{user.name}</div>
                                                <div className="text-xs text-gray-500">ID: {user.id}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td>{user.email}</td>
                                    <td>
                                        <Badge variant={
                                            user.role === 'PRESIDENTE' ? 'danger' :
                                                user.role === 'ADMINISTRADOR' ? 'info' :
                                                    user.role === 'CAJERA' ? 'warning' :
                                                        user.role === 'VENDEDOR' ? 'success' :
                                                            'default'
                                        }>
                                            <Shield className="w-3 h-3 mr-1" />
                                            {getRoleName(user.role)}
                                        </Badge>
                                    </td>
                                    <td>
                                        <Badge variant={user.isActive ? 'success' : 'danger'}>
                                            {user.isActive ? (
                                                <>
                                                    <CheckCircle2 className="w-3 h-3 mr-1" />
                                                    Activo
                                                </>
                                            ) : (
                                                <>
                                                    <XCircle className="w-3 h-3 mr-1" />
                                                    Inactivo
                                                </>
                                            )}
                                        </Badge>
                                    </td>
                                    <td className="text-sm text-gray-600 dark:text-gray-400">
                                        {user.lastAccess}
                                    </td>
                                    <td>
                                        <div className="flex items-center justify-end gap-2">
                                            <button
                                                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                                                onClick={() => {
                                                    setSelectedUser(user)
                                                    setShowModal(true)
                                                }}
                                            >
                                                <Edit className="w-4 h-4" />
                                            </button>
                                            <button
                                                className="p-2 hover:bg-danger-100 dark:hover:bg-danger-900/20 rounded-lg transition-colors text-danger-600"
                                                onClick={() => handleDeleteClick(user)}
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </Card>

            {/* Modal */}
            {showModal && (
                <UserModal
                    user={selectedUser}
                    onClose={() => setShowModal(false)}
                />
            )}

            {/* Delete Confirmation Modal */}
            {showDeleteConfirm && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-sm animate-in">
                    <Card variant="glass" className="w-full max-w-md">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-12 h-12 rounded-full bg-danger-100 dark:bg-danger-900/30 flex items-center justify-center">
                                <AlertTriangle className="w-6 h-6 text-danger-600" />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold">Eliminar Usuario</h3>
                                <p className="text-sm text-gray-600">Esta acción no se puede deshacer</p>
                            </div>
                        </div>

                        <p className="text-gray-700 dark:text-gray-300 mb-4">
                            ¿Estás seguro de que deseas eliminar a <strong>{userToDelete?.name}</strong>?
                        </p>

                        {deleteMessage && (
                            <div className={`p-3 rounded-lg mb-4 ${deleteMessage.includes('correctamente') ? 'bg-success-100 text-success-800' : 'bg-danger-100 text-danger-800'}`}>
                                {deleteMessage}
                            </div>
                        )}

                        <div className="flex gap-3">
                            <Button
                                variant="outline"
                                className="flex-1"
                                onClick={() => {
                                    setShowDeleteConfirm(false)
                                    setUserToDelete(null)
                                }}
                                disabled={isDeleting}
                            >
                                Cancelar
                            </Button>
                            <Button
                                variant="danger"
                                className="flex-1"
                                onClick={confirmDelete}
                                disabled={isDeleting}
                            >
                                {isDeleting ? 'Eliminando...' : 'Eliminar'}
                            </Button>
                        </div>
                    </Card>
                </div>
            )}
        </div>
    )
}

function UserModal({ user, onClose }: { user: any; onClose: () => void }) {
    const [formData, setFormData] = useState({
        name: user?.name || '',
        email: user?.email || '',
        role: user?.role || 'VENDEDOR',
        password: '',
        confirmPassword: '',
        isActive: user?.isActive ?? true,
    })
    const [showPassword, setShowPassword] = useState(false)
    const [isSaving, setIsSaving] = useState(false)
    const [errorMessage, setErrorMessage] = useState('')
    const [successMessage, setSuccessMessage] = useState('')

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
        }))
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setErrorMessage('')
        setSuccessMessage('')

        // Validation
        if (!formData.name || !formData.email) {
            setErrorMessage('Nombre y email son requeridos')
            return
        }

        if (!user && !formData.password) {
            setErrorMessage('La contraseña es requerida para usuarios nuevos')
            return
        }

        if (!user && formData.password !== formData.confirmPassword) {
            setErrorMessage('Las contraseñas no coinciden')
            return
        }

        if (!user && formData.password.length < 8) {
            setErrorMessage('La contraseña debe tener al menos 8 caracteres')
            return
        }

        setIsSaving(true)
        try {
            const response = await fetch('/api/users', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: formData.name,
                    email: formData.email,
                    password: formData.password,
                    role: formData.role,
                }),
            })

            const data = await response.json()

            if (response.ok) {
                setSuccessMessage('Usuario creado correctamente')
                setTimeout(() => {
                    window.location.reload()
                }, 1000)
            } else {
                setErrorMessage(data.error || 'Error al crear usuario')
            }
        } catch (error) {
            setErrorMessage('Error de conexión')
        } finally {
            setIsSaving(false)
        }
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-sm animate-in">
            <Card variant="glass" className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-display font-bold">
                        {user ? 'Editar Usuario' : 'Nuevo Usuario'}
                    </h2>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                    >
                        <XCircle className="w-6 h-6" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-5">
                    <div className="grid md:grid-cols-2 gap-4">
                        <Input
                            label="Nombre Completo"
                            name="name"
                            value={formData.name}
                            onChange={handleChange}
                            icon={<User className="w-5 h-5" />}
                            required
                        />

                        <Input
                            label="Email"
                            name="email"
                            type="email"
                            value={formData.email}
                            onChange={handleChange}
                            icon={<Mail className="w-5 h-5" />}
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Rol
                        </label>
                        <select
                            name="role"
                            value={formData.role}
                            onChange={handleChange}
                            className="input-modern"
                            required
                        >
                            <option value="PRESIDENTE">Presidente</option>
                            <option value="ADMINISTRADOR">Administrador</option>
                            <option value="VENDEDOR">Vendedor</option>
                            <option value="CAJERA">Cajera</option>
                            <option value="ALMACENISTA">Almacenista</option>
                            <option value="ASISTENTE">Asistente Administrativo</option>
                        </select>
                        <p className="mt-1 text-xs text-gray-500">
                            {getRoleDescription(formData.role)}
                        </p>
                    </div>

                    {!user && (
                        <>
                            <div className="grid md:grid-cols-2 gap-4">
                                <div className="relative">
                                    <Input
                                        label="Contraseña"
                                        name="password"
                                        type={showPassword ? 'text' : 'password'}
                                        value={formData.password}
                                        onChange={handleChange}
                                        icon={<Lock className="w-5 h-5" />}
                                        required={!user}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-3 top-10 text-gray-400 hover:text-gray-600"
                                    >
                                        {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                    </button>
                                </div>

                                <Input
                                    label="Confirmar Contraseña"
                                    name="confirmPassword"
                                    type={showPassword ? 'text' : 'password'}
                                    value={formData.confirmPassword}
                                    onChange={handleChange}
                                    icon={<Lock className="w-5 h-5" />}
                                    required={!user}
                                />
                            </div>

                            <div className="bg-info-50 dark:bg-info-900/20 p-4 rounded-lg">
                                <p className="text-sm text-info-800 dark:text-info-200 font-medium mb-2">
                                    Requisitos de Contraseña:
                                </p>
                                <ul className="text-xs text-info-700 dark:text-info-300 space-y-1">
                                    <li>• Mínimo 8 caracteres</li>
                                    <li>• Al menos una mayúscula</li>
                                    <li>• Al menos un número</li>
                                    <li>• Al menos un carácter especial</li>
                                </ul>
                            </div>
                        </>
                    )}

                    <div className="flex items-center gap-2">
                        <input
                            type="checkbox"
                            name="isActive"
                            checked={formData.isActive}
                            onChange={handleChange}
                            className="w-4 h-4 rounded border-gray-300 text-primary-500 focus:ring-primary-500"
                        />
                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                            Usuario Activo
                        </label>
                    </div>

                    {errorMessage && (
                        <div className="p-3 rounded-lg bg-danger-100 text-danger-800 dark:bg-danger-900/30 dark:text-danger-200">
                            {errorMessage}
                        </div>
                    )}

                    {successMessage && (
                        <div className="p-3 rounded-lg bg-success-100 text-success-800 dark:bg-success-900/30 dark:text-success-200">
                            {successMessage}
                        </div>
                    )}

                    <div className="flex gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                        <Button type="button" variant="outline" onClick={onClose} className="flex-1" disabled={isSaving}>
                            Cancelar
                        </Button>
                        <Button type="submit" variant="primary" className="flex-1" disabled={isSaving}>
                            {isSaving ? 'Guardando...' : (user ? 'Guardar Cambios' : 'Crear Usuario')}
                        </Button>
                    </div>
                </form>
            </Card>
        </div>
    )
}

function getRoleName(role: string): string {
    const roles: Record<string, string> = {
        PRESIDENTE: 'Presidente',
        ADMINISTRADOR: 'Administrador',
        VENDEDOR: 'Vendedor',
        CAJERA: 'Cajera',
        ALMACENISTA: 'Almacenista',
        ASISTENTE: 'Asistente Administrativo',
    }
    return roles[role] || role
}

function getRoleDescription(role: string): string {
    const descriptions: Record<string, string> = {
        PRESIDENTE: 'Acceso total al sistema, gestión de usuarios y configuración general',
        ADMINISTRADOR: 'Gestión general, ventas, compras, inventario y reportes',
        VENDEDOR: 'Punto de venta, gestión de clientes y consulta de inventario',
        CAJERA: 'Gestión de caja, cobros y punto de venta',
        ALMACENISTA: 'Control de inventario, productos y movimientos de stock',
        ASISTENTE: 'Visualización de reportes y funciones de soporte',
    }
    return descriptions[role] || ''
}

const users = [
    { id: 'U001', name: 'Marcos Toyota', email: 'marcos@empresa.com', role: 'PRESIDENTE', isActive: true, lastAccess: 'Hace 2 horas' },
    { id: 'U002', name: 'María González', email: 'maria@empresa.com', role: 'ADMINISTRADOR', isActive: true, lastAccess: 'Hace 1 día' },
    { id: 'U003', name: 'Carlos Rodríguez', email: 'carlos@empresa.com', role: 'VENDEDOR', isActive: true, lastAccess: 'Hace 3 horas' },
    { id: 'U004', name: 'Ana Martínez', email: 'ana@empresa.com', role: 'CAJERA', isActive: true, lastAccess: 'Hace 30 min' },
    { id: 'U005', name: 'Pedro Sánchez', email: 'pedro@empresa.com', role: 'ALMACENISTA', isActive: true, lastAccess: 'Hace 5 horas' },
    { id: 'U006', name: 'Laura Fernández', email: 'laura@empresa.com', role: 'ASISTENTE', isActive: false, lastAccess: 'Hace 15 días' },
    { id: 'U007', name: 'Diego Torres', email: 'diego@empresa.com', role: 'CAJERA', isActive: true, lastAccess: 'Hace 1 hora' },
    { id: 'U008', name: 'Carmen López', email: 'carmen@empresa.com', role: 'VENDEDOR', isActive: true, lastAccess: 'Hace 2 días' },
    { id: 'U009', name: 'Roberto Díaz', email: 'roberto@empresa.com', role: 'ADMINISTRADOR', isActive: true, lastAccess: 'Hace 4 horas' },
    { id: 'U010', name: 'Sofia Castro', email: 'sofia@empresa.com', role: 'ASISTENTE', isActive: true, lastAccess: 'Hace 6 horas' },
    { id: 'U011', name: 'Luis Ramírez', email: 'luis@empresa.com', role: 'ALMACENISTA', isActive: true, lastAccess: 'Hace 8 horas' },
    { id: 'U012', name: 'Patricia Morales', email: 'patricia@empresa.com', role: 'VENDEDOR', isActive: false, lastAccess: 'Hace 30 días' },
]
