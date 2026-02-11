import React, { useState, useEffect } from 'react';
import { Trash2, AlertTriangle, User, Mail, Phone, Lock, Save, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';

export function AccountSettings() {
  const { profile, deleteAccount, updateProfile, updatePassword, user } = useAuth();

  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [prenom, setPrenom] = useState('');
  const [nom, setNom] = useState('');
  const [telephone, setTelephone] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileMessage, setProfileMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [savingPassword, setSavingPassword] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [confirmText, setConfirmText] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  useEffect(() => {
    if (profile) {
      setPrenom(profile.prenom || '');
      setNom(profile.nom || '');
      setTelephone(profile.telephone || '');
    }
  }, [profile]);

  const capitalize = (str: string) => {
    if (!str) return '';
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingProfile(true);
    setProfileMessage(null);

    try {
      await updateProfile(prenom, nom, telephone);
      setProfileMessage({ type: 'success', text: 'Informations mises à jour avec succès' });
      setIsEditingProfile(false);
      setTimeout(() => setProfileMessage(null), 3000);
    } catch (error: any) {
      setProfileMessage({ type: 'error', text: error.message || 'Une erreur est survenue' });
    } finally {
      setSavingProfile(false);
    }
  };

  const handleCancelEdit = () => {
    setIsEditingProfile(false);
    if (profile) {
      setPrenom(profile.prenom || '');
      setNom(profile.nom || '');
      setTelephone(profile.telephone || '');
    }
    setProfileMessage(null);
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingPassword(true);
    setPasswordMessage(null);

    if (newPassword !== confirmPassword) {
      setPasswordMessage({ type: 'error', text: 'Les mots de passe ne correspondent pas' });
      setSavingPassword(false);
      return;
    }

    if (newPassword.length < 8) {
      setPasswordMessage({ type: 'error', text: 'Le mot de passe doit contenir au moins 8 caractères' });
      setSavingPassword(false);
      return;
    }

    if (!/\d/.test(newPassword)) {
      setPasswordMessage({ type: 'error', text: 'Le mot de passe doit contenir au moins un chiffre' });
      setSavingPassword(false);
      return;
    }

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: user!.email!,
        password: oldPassword,
      });

      if (error) {
        throw new Error('Ancien mot de passe incorrect');
      }

      await updatePassword(newPassword);
      setPasswordMessage({ type: 'success', text: 'Mot de passe modifié avec succès' });
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => setPasswordMessage(null), 3000);
    } catch (error: any) {
      setPasswordMessage({ type: 'error', text: error.message || 'Une erreur est survenue' });
    } finally {
      setSavingPassword(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (confirmText !== 'SUPPRIMER') {
      setDeleteError('Veuillez taper "SUPPRIMER" pour confirmer');
      return;
    }

    setDeleting(true);
    setDeleteError('');

    try {
      await deleteAccount();
    } catch (error: any) {
      setDeleteError(error.message || 'Une erreur est survenue lors de la suppression');
      setDeleting(false);
    }
  };

  if (!profile) return null;

  return (
    <div className="space-y-6">
      {/* Section Informations du compte */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <User className="w-5 h-5" />
            Informations du compte
          </h3>
          {!isEditingProfile && (
            <button
              onClick={() => setIsEditingProfile(true)}
              className="text-sm text-[#1B4F8A] hover:text-[#153d6e] font-medium transition"
            >
              Modifier
            </button>
          )}
        </div>

        {!isEditingProfile ? (
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <User className="w-5 h-5 text-gray-400 mt-0.5" />
              <div>
                <p className="text-sm text-gray-600">Prénom</p>
                <p className="font-medium text-gray-900">{capitalize(prenom)}</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <User className="w-5 h-5 text-gray-400 mt-0.5" />
              <div>
                <p className="text-sm text-gray-600">Nom</p>
                <p className="font-medium text-gray-900">{capitalize(nom)}</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Mail className="w-5 h-5 text-gray-400 mt-0.5" />
              <div>
                <p className="text-sm text-gray-600">Email</p>
                <p className="font-medium text-gray-900">{profile.email}</p>
              </div>
            </div>

            {telephone && (
              <div className="flex items-start gap-3">
                <Phone className="w-5 h-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-sm text-gray-600">Téléphone</p>
                  <p className="font-medium text-gray-900">{telephone}</p>
                </div>
              </div>
            )}

            {profileMessage && (
              <div className={`px-4 py-3 rounded-lg text-sm ${
                profileMessage.type === 'success'
                  ? 'bg-green-50 border border-green-300 text-green-800'
                  : 'bg-red-50 border border-red-300 text-red-800'
              }`}>
                {profileMessage.text}
              </div>
            )}
          </div>
        ) : (
          <form onSubmit={handleSaveProfile} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Prénom
              </label>
              <input
                type="text"
                value={prenom}
                onChange={(e) => setPrenom(e.target.value)}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1B4F8A] focus:border-transparent outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nom
              </label>
              <input
                type="text"
                value={nom}
                onChange={(e) => setNom(e.target.value)}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1B4F8A] focus:border-transparent outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <input
                type="email"
                value={profile.email}
                disabled
                className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-500 cursor-not-allowed"
              />
              <p className="text-xs text-gray-500 mt-1">
                L'email ne peut pas être modifié
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Téléphone (optionnel)
              </label>
              <input
                type="tel"
                value={telephone}
                onChange={(e) => setTelephone(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1B4F8A] focus:border-transparent outline-none"
              />
            </div>

            {profileMessage && (
              <div className={`px-4 py-3 rounded-lg text-sm ${
                profileMessage.type === 'success'
                  ? 'bg-green-50 border border-green-300 text-green-800'
                  : 'bg-red-50 border border-red-300 text-red-800'
              }`}>
                {profileMessage.text}
              </div>
            )}

            <div className="flex gap-3">
              <button
                type="submit"
                disabled={savingProfile}
                className="flex items-center gap-2 bg-[#1B4F8A] text-white px-6 py-2 rounded-lg hover:bg-[#153d6e] transition font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Save className="w-5 h-5" />
                {savingProfile ? 'Enregistrement...' : 'Enregistrer'}
              </button>
              <button
                type="button"
                onClick={handleCancelEdit}
                disabled={savingProfile}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition font-medium disabled:opacity-50"
              >
                Annuler
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Section Changer mon mot de passe */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2 mb-6">
          <Lock className="w-5 h-5" />
          Changer mon mot de passe
        </h3>

        <form onSubmit={handleChangePassword} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Ancien mot de passe
            </label>
            <div className="relative">
              <input
                type={showOldPassword ? 'text' : 'password'}
                value={oldPassword}
                onChange={(e) => setOldPassword(e.target.value)}
                required
                className="w-full px-4 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1B4F8A] focus:border-transparent outline-none"
              />
              <button
                type="button"
                onClick={() => setShowOldPassword(!showOldPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
              >
                {showOldPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nouveau mot de passe
            </label>
            <div className="relative">
              <input
                type={showNewPassword ? 'text' : 'password'}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                minLength={8}
                className="w-full px-4 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1B4F8A] focus:border-transparent outline-none"
              />
              <button
                type="button"
                onClick={() => setShowNewPassword(!showNewPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
              >
                {showNewPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Minimum 8 caractères avec au moins un chiffre
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Confirmer le nouveau mot de passe
            </label>
            <div className="relative">
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                minLength={8}
                className="w-full px-4 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1B4F8A] focus:border-transparent outline-none"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
              >
                {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {passwordMessage && (
            <div className={`px-4 py-3 rounded-lg text-sm ${
              passwordMessage.type === 'success'
                ? 'bg-green-50 border border-green-300 text-green-800'
                : 'bg-red-50 border border-red-300 text-red-800'
            }`}>
              {passwordMessage.text}
            </div>
          )}

          <button
            type="submit"
            disabled={savingPassword}
            className="flex items-center gap-2 bg-[#1B4F8A] text-white px-6 py-2 rounded-lg hover:bg-[#153d6e] transition font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Lock className="w-5 h-5" />
            {savingPassword ? 'Modification...' : 'Changer le mot de passe'}
          </button>
        </form>
      </div>

      {/* Section Zone de danger */}
      <div className="bg-red-50 border-2 border-red-200 rounded-lg p-6">
        <div className="flex items-start gap-3 mb-4">
          <AlertTriangle className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="text-lg font-semibold text-red-900 mb-2">
              Zone de danger
            </h3>
            <p className="text-sm text-red-700 mb-4">
              La suppression de votre compte est irréversible. Toutes vos données seront définitivement effacées.
            </p>
          </div>
        </div>

        {!showDeleteConfirm ? (
          <button
            onClick={() => setShowDeleteConfirm(true)}
            className="flex items-center gap-2 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition font-medium"
          >
            <Trash2 className="w-5 h-5" />
            Supprimer mon compte
          </button>
        ) : (
          <div className="space-y-4">
            <div className="bg-white border-2 border-red-300 rounded-lg p-4">
              <p className="text-sm text-gray-900 font-medium mb-3">
                Cette action est irréversible. Toutes vos données seront supprimées, incluant :
              </p>
              <ul className="text-sm text-gray-700 space-y-1 list-disc list-inside mb-4">
                <li>Votre profil utilisateur</li>
                <li>Toutes vos boîtes aux lettres</li>
                <li>Toutes vos notifications</li>
                <li>Toutes vos demandes de contact</li>
              </ul>
              <p className="text-sm text-gray-900 font-medium mb-2">
                Pour confirmer, tapez <span className="font-bold text-red-600">SUPPRIMER</span> ci-dessous :
              </p>
              <input
                type="text"
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none"
                placeholder="SUPPRIMER"
              />
            </div>

            {deleteError && (
              <div className="bg-red-100 border border-red-300 text-red-800 px-4 py-3 rounded-lg text-sm">
                {deleteError}
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={handleDeleteAccount}
                disabled={deleting || confirmText !== 'SUPPRIMER'}
                className="flex items-center gap-2 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Trash2 className="w-5 h-5" />
                {deleting ? 'Suppression...' : 'Confirmer la suppression'}
              </button>
              <button
                onClick={() => {
                  setShowDeleteConfirm(false);
                  setConfirmText('');
                  setDeleteError('');
                }}
                disabled={deleting}
                className="px-4 py-2 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition font-medium disabled:opacity-50"
              >
                Annuler
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
