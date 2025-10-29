import React from 'react';
import { Button } from './ui/button';
import { UserRound, Mail, Phone, Calendar, Stethoscope, ClipboardList } from 'lucide-react';

interface PatientFormProps {
  onSubmit: (formData: PatientFormData) => void;
  onCancel: () => void;
}

export interface PatientFormData {
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  email: string;
  phone: string;
  returningPatient: boolean;
  sex: 'male' | 'female' | '';
  referringDoctor: string;
  reasonForVisit?: string;
}

export function PatientForm({ onSubmit, onCancel }: PatientFormProps) {
  const [formData, setFormData] = React.useState<PatientFormData>({
    firstName: '',
    lastName: '',
    dateOfBirth: '',
    email: '',
    phone: '',
    returningPatient: false,
    sex: '',
    referringDoctor: '',
    reasonForVisit: '',
  });

  const [errors, setErrors] = React.useState<Partial<Record<keyof PatientFormData, string>>>({});

  const validatePhoneNumber = (phone: string): boolean => {
    // Matches format: XXX-XXX-XXXX
    const phoneRegex = /^\d{3}-\d{3}-\d{4}$/;
    return phoneRegex.test(phone);
  };

  const formatPhoneNumber = (phone: string): string => {
    // Remove all non-digit characters
    const digits = phone.replace(/\D/g, '');
    
    // Format as XXX-XXX-XXXX
    if (digits.length >= 10) {
      return `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6, 10)}`;
    }
    
    return digits;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate form
    const newErrors: Partial<Record<keyof PatientFormData, string>> = {};
    
    if (!formData.firstName.trim()) {
      newErrors.firstName = 'First name is required';
    }

    if (!formData.lastName.trim()) {
      newErrors.lastName = 'Last name is required';
    }
    
    if (!formData.dateOfBirth) {
      newErrors.dateOfBirth = 'Date of birth is required';
    } else {
      const dob = new Date(formData.dateOfBirth);
      const today = new Date();
      if (dob > today) {
        newErrors.dateOfBirth = 'Date of birth cannot be in the future';
      }
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }
    
    if (!formData.phone.trim()) {
      newErrors.phone = 'Phone number is required';
    } else if (!validatePhoneNumber(formData.phone)) {
      newErrors.phone = 'Please enter a valid phone number (XXX-XXX-XXXX)';
    }

    if (!formData.sex) {
      newErrors.sex = 'Please select your gender';
    }

    if (!formData.referringDoctor.trim()) {
      newErrors.referringDoctor = 'Referring doctor is required';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    // Format phone number before submitting
    const formattedData = {
      ...formData,
      phone: formatPhoneNumber(formData.phone)
    };

    onSubmit(formattedData);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    
    if (name === 'phone') {
      // Format phone number as user types
      const formattedPhone = formatPhoneNumber(value);
      setFormData(prev => ({
        ...prev,
        [name]: formattedPhone
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
      }));
    }
    
    // Clear error when user starts typing
    if (errors[name as keyof PatientFormData]) {
      setErrors(prev => ({ ...prev, [name]: undefined }));
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-lg border">
      <h3 className="text-lg font-semibold mb-4">Patient Information</h3>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* First Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="firstName">
              First Name *
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <UserRound className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                id="firstName"
                name="firstName"
                value={formData.firstName}
                onChange={handleChange}
                className={`block w-full pl-10 pr-3 py-2 rounded-md border ${
                  errors.firstName ? 'border-red-300' : 'border-gray-300'
                } focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500`}
                placeholder="John"
              />
            </div>
            {errors.firstName && (
              <p className="mt-1 text-sm text-red-600">{errors.firstName}</p>
            )}
          </div>

          {/* Last Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="lastName">
              Last Name *
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <UserRound className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                id="lastName"
                name="lastName"
                value={formData.lastName}
                onChange={handleChange}
                className={`block w-full pl-10 pr-3 py-2 rounded-md border ${
                  errors.lastName ? 'border-red-300' : 'border-gray-300'
                } focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500`}
                placeholder="Doe"
              />
            </div>
            {errors.lastName && (
              <p className="mt-1 text-sm text-red-600">{errors.lastName}</p>
            )}
          </div>
        </div>

        {/* Sex */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="sex">
            Gender *
          </label>
          <select
            id="sex"
            name="sex"
            value={formData.sex}
            onChange={handleChange}
            className={`block w-full py-2 px-3 rounded-md border ${
              errors.sex ? 'border-red-300' : 'border-gray-300'
            } focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500`}
          >
            <option value="">Select gender</option>
            <option value="male">Male/Other</option>
            <option value="female">Female</option>
          </select>
          {errors.sex && (
            <p className="mt-1 text-sm text-red-600">{errors.sex}</p>
          )}
        </div>

        {/* Date of Birth */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="dateOfBirth">
            Date of Birth *
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Calendar className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="date"
              id="dateOfBirth"
              name="dateOfBirth"
              value={formData.dateOfBirth}
              onChange={handleChange}
              max={new Date().toISOString().split('T')[0]}
              className={`block w-full pl-10 pr-3 py-2 rounded-md border ${
                errors.dateOfBirth ? 'border-red-300' : 'border-gray-300'
              } focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500`}
            />
          </div>
          {errors.dateOfBirth && (
            <p className="mt-1 text-sm text-red-600">{errors.dateOfBirth}</p>
          )}
        </div>

        {/* Email */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="email">
            Email *
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Mail className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className={`block w-full pl-10 pr-3 py-2 rounded-md border ${
                errors.email ? 'border-red-300' : 'border-gray-300'
              } focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500`}
              placeholder="john@example.com"
            />
          </div>
          {errors.email && (
            <p className="mt-1 text-sm text-red-600">{errors.email}</p>
          )}
        </div>

        {/* Phone */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="phone">
            Phone *
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Phone className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="tel"
              id="phone"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              className={`block w-full pl-10 pr-3 py-2 rounded-md border ${
                errors.phone ? 'border-red-300' : 'border-gray-300'
              } focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500`}
              placeholder="XXX-XXX-XXXX"
            />
          </div>
          {errors.phone && (
            <p className="mt-1 text-sm text-red-600">{errors.phone}</p>
          )}
        </div>

        {/* Referring Doctor */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="referringDoctor">
            Referring Doctor *
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Stethoscope className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              id="referringDoctor"
              name="referringDoctor"
              value={formData.referringDoctor}
              onChange={handleChange}
              className={`block w-full pl-10 pr-3 py-2 rounded-md border ${
                errors.referringDoctor ? 'border-red-300' : 'border-gray-300'
              } focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500`}
              placeholder="Dr. Smith"
            />
          </div>
          {errors.referringDoctor && (
            <p className="mt-1 text-sm text-red-600">{errors.referringDoctor}</p>
          )}
        </div>

        {/* Reason for Visit */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="reasonForVisit">
            Reason for Visit (Optional)
          </label>
          <div className="relative">
            <div className="absolute top-3 left-3">
              <ClipboardList className="h-5 w-5 text-gray-400" />
            </div>
            <textarea
              id="reasonForVisit"
              name="reasonForVisit"
              value={formData.reasonForVisit}
              onChange={handleChange}
              rows={3}
              className="block w-full pl-10 pr-3 py-2 rounded-md border border-gray-300 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Please describe your reason for visit"
            />
          </div>
        </div>

        {/* Returning Patient Checkbox */}
        <div className="flex items-center">
          <input
            type="checkbox"
            id="returningPatient"
            name="returningPatient"
            checked={formData.returningPatient}
            onChange={handleChange}
            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
          />
          <label htmlFor="returningPatient" className="ml-2 block text-sm text-gray-700">
            I am a returning patient
          </label>
        </div>

        <div className="flex justify-end space-x-3 pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            Continue
          </Button>
        </div>
      </form>
      
      <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-md">
        <p className="text-sm text-blue-800">
          <strong>Please note:</strong> The fee for your initial visit is $295, which includes an examination as well as all x-rays and records taken during your appointment.
        </p>
      </div>
    </div>
  );
}