import React, { useState, useEffect } from 'react';
import { Quarter, Sample } from '../../models/Quarter';
import { quarterService } from '../../services/quarterService';
import { useAuth } from '../../contexts/AuthContext';

const AdminQuarterManagement: React.FC = () => {
  const { isAdmin } = useAuth();
  const [quarters, setQuarters] = useState<Quarter[]>([]);
  const [currentQuarter, setCurrentQuarter] = useState<Partial<Quarter>>({
    name: '',
    active: false,
    samples: []
  });

  // Sample template for new quarter
  const defaultSample: Sample = {
    id: '',
    age: 0,
    proof: 0,
    mashbill: 'Bourbon'
  };

  // Fetch existing quarters
  useEffect(() => {
    const fetchQuarters = async () => {
      try {
        const fetchedQuarters = await quarterService.getAllQuarters();
        setQuarters(fetchedQuarters);
      } catch (error) {
        console.error('Failed to fetch quarters', error);
      }
    };

    if (isAdmin) {
      fetchQuarters();
    }
  }, [isAdmin]);

  // Add new sample to current quarter
  const addSample = () => {
    setCurrentQuarter(prev => ({
      ...prev,
      samples: [...(prev.samples || []), { ...defaultSample, id: `sample-${(prev.samples?.length || 0) + 1}` }]
    }));
  };

  // Update sample details
  const updateSample = (index: number, field: keyof Sample, value: string | number) => {
    setCurrentQuarter(prev => ({
      ...prev,
      samples: prev.samples?.map((sample, idx) => 
        idx === index ? { ...sample, [field]: value } : sample
      ) || []
    }));
  };

  // Remove sample from current quarter
  const removeSample = (index: number) => {
    setCurrentQuarter(prev => ({
      ...prev,
      samples: prev.samples?.filter((_, idx) => idx !== index) || []
    }));
  };

  // Save quarter
  const saveQuarter = async () => {
    try {
      // Validate quarter
      if (!currentQuarter.name || (currentQuarter.samples?.length || 0) !== 4) {
        alert('Quarter must have a name and exactly 4 samples');
        return;
      }

      // Save quarter
      await quarterService.createQuarter(currentQuarter as Quarter);
      
      // Reset and refresh
      setCurrentQuarter({
        name: '',
        active: false,
        samples: []
      });
      
      // Refresh quarters list
      const updatedQuarters = await quarterService.getAllQuarters();
      setQuarters(updatedQuarters);
    } catch (error) {
      console.error('Failed to save quarter', error);
    }
  };

  // Toggle quarter activation
  const toggleQuarterActivation = async (quarterId: string) => {
    try {
      await quarterService.updateQuarter(quarterId, { active: !quarters.find(q => q.id === quarterId)?.active });
      
      // Refresh quarters
      const updatedQuarters = await quarterService.getAllQuarters();
      setQuarters(updatedQuarters);
    } catch (error) {
      console.error('Failed to toggle quarter', error);
    }
  };

  // Render admin interface
  if (!isAdmin) {
    return <div>Access Denied</div>;
  }

  return (
    <div className="admin-quarter-management">
      <h1>Quarter Management</h1>
      
      {/* Quarter Creation Form */}
      <div className="quarter-creation">
        <input
          type="text"
          placeholder="Quarter Name (e.g., Q1 2024)"
          value={currentQuarter.name || ''}
          onChange={(e) => setCurrentQuarter(prev => ({ ...prev, name: e.target.value }))}
        />
        
        <div className="samples-container">
          {(currentQuarter.samples || []).map((sample, index) => (
            <div key={`sample-${index}`} className="sample-input">
              <input
                type="number"
                placeholder="Age"
                value={sample.age}
                onChange={(e) => updateSample(index, 'age', Number(e.target.value))}
              />
              <input
                type="number"
                placeholder="Proof"
                value={sample.proof}
                onChange={(e) => updateSample(index, 'proof', Number(e.target.value))}
              />
              <select
                value={sample.mashbill}
                onChange={(e) => updateSample(index, 'mashbill', e.target.value)}
              >
                <option value="Bourbon">Bourbon</option>
                <option value="Rye">Rye</option>
                <option value="Wheat">Wheat</option>
                <option value="Single Malt">Single Malt</option>
                <option value="Specialty">Specialty</option>
              </select>
              <button onClick={() => removeSample(index)}>Remove</button>
            </div>
          ))}
        </div>
        
        {(currentQuarter.samples?.length || 0) < 4 && (
          <button onClick={addSample}>Add Sample</button>
        )}
        
        <button onClick={saveQuarter}>Save Quarter</button>
      </div>

      {/* Existing Quarters List */}
      <div className="quarters-list">
        <h2>Existing Quarters</h2>
        {quarters.map(quarter => (
          <div key={quarter.id} className="quarter-item">
            <span>{quarter.name}</span>
            <span>Samples: {quarter.samples.length}</span>
            <button onClick={() => toggleQuarterActivation(quarter.id)}>
              {quarter.active ? 'Deactivate' : 'Activate'}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AdminQuarterManagement;