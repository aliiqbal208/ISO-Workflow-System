import { useState, type ChangeEvent } from 'react';
import { createPortal } from 'react-dom';
import CreateOrgModal from './CreateOrgModal';
import type { Organization } from '../../types';

const CREATE_ORG_VALUE = '__CREATE_ORG__';

interface OrgSelectProps {
  organizations: Organization[];
  value: string;
  onChange: (orgId: string, newOrg?: Organization) => void;
  required?: boolean;
}

export default function OrgSelect({ organizations, value, onChange, required }: OrgSelectProps) {
  const [showModal, setShowModal] = useState(false);

  const handleChange = (e: ChangeEvent<HTMLSelectElement>) => {
    if (e.target.value === CREATE_ORG_VALUE) {
      e.target.value = value;
      setShowModal(true);
      return;
    }
    onChange(e.target.value);
  };

  const handleOrgCreated = (newOrg: Organization) => {
    setShowModal(false);
    onChange(newOrg._id, newOrg);
  };

  return (
    <>
      <select
        className="w-full px-3.5 py-2.5 border-[1.5px] border-slate-200 rounded-md text-sm bg-white text-slate-800 mb-3 transition-all focus:outline-none focus:border-primary focus:ring-3 focus:ring-primary/15"
        value={value}
        onChange={handleChange}
        required={required}
      >
        <option value="">Select an organization...</option>
        {organizations.map((org) => (
          <option key={org._id} value={org._id}>
            {org.name}
          </option>
        ))}
        <option value={CREATE_ORG_VALUE}>＋ Create New Organization...</option>
      </select>

      {showModal &&
        createPortal(
          <CreateOrgModal onClose={() => setShowModal(false)} onCreated={handleOrgCreated} />,
          document.body
        )}
    </>
  );
}
