import { useState, useEffect, FC } from 'react';
import { WhiskeySample, MashbillType, MASHBILL_TYPES } from '../../types/game.types';
import { Dialog } from '../../components/ui/dialog';
import { shopifyService, ShopifyProduct } from '../../services/shopify-integration.service';

interface SampleFormData {
  name: string;
  age: number;
  proof: number;
  mashbill: MashbillType;
  distillery: string;
  description: string;
  shopifyProduct: ShopifyProduct | null;
  isDialogOpen: boolean;
  shopifyProductError: string | null;
  onSave: (sample: WhiskeySample) => void;
  onDialogClose: () => void;
  onProductChange: (productId: string) => void;
  onProductSelect: (productId: string) => void;
}

const defaultSampleData: SampleFormData = {
  name: '',
  age: 0,
  proof: 80,
  mashbill: MASHBILL_TYPES.BOURBON,  // Use the constant
  distillery: '',
  description: '',
  shopifyProduct: null,
  isDialogOpen: false,
  shopifyProductError: null,
  onSave: () => { },
  onDialogClose: () => { },
  onProductChange: (productId: string) => {
    console.log('Product changed:', productId);
  },
  onProductSelect: (productId: string) => {
    console.log('Product selected:', productId);
  }
};

interface SampleEditorProps {
  samples: WhiskeySample[];
  onUpdate: (samples: WhiskeySample[]) => void;
  onClose: () => void;
}

export const SampleEditor: FC<SampleEditorProps> = ({ samples, onUpdate, onClose }) => {
  const [editingSample, setEditingSample] = useState<SampleFormData>(defaultSampleData);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [shopifyProducts, setShopifyProducts] = useState<ShopifyProduct[]>([]);
  const [isLoadingProducts, setIsLoadingProducts] = useState(false);
  const [productError, setProductError] = useState<string | null>(null);

  const onDialogClose = () => {
    setEditingSample(defaultSampleData);
    setEditingIndex(null);
  };

  useEffect(() => {
    loadShopifyProducts();
  }, []);

  const loadShopifyProducts = async () => {
    try {
      setIsLoadingProducts(true);
      setProductError(null);
      const products = await shopifyService.getProduct();
      setShopifyProducts(products);
    } catch (err) {
      setProductError('Failed to load Shopify products');
      console.error('Error loading Shopify products:', err);
    } finally {
      setIsLoadingProducts(false);
    }
  };

  const onSave = (sample: WhiskeySample) => {
    if (editingIndex !== null) {
      const newSamples = [...samples];
      newSamples[editingIndex] = sample;
      onUpdate(newSamples);
    }
  };

  const handleProductSelect = async (productId: string) => {
    try {
      const product = shopifyProducts.find(p => p.id === productId);
      if (!product) return;

      const validation = await shopifyService.validateMetafields(productId);
      if (!validation.isValid) {
        throw new Error(`Missing product details: ${validation.missing.join(', ')}`);
      }

      const sampleData = shopifyService.convertToSample(product);
      const handleProductChange = (productId: string) => {
        console.log('Product changed:', productId);
      };

      setEditingSample({
        name: sampleData.name || '',
        age: sampleData.age || 0,
        proof: sampleData.proof || 80,
        mashbill: sampleData.mashbill || MASHBILL_TYPES.BOURBON,
        distillery: sampleData.distillery || '',
        description: sampleData.description || '',
        shopifyProduct: product,
        isDialogOpen: false,
        shopifyProductError: null,
        onSave,
        onDialogClose,
        onProductChange: handleProductChange,
        onProductSelect: handleProductSelect
      });
    } catch (err) {
      console.error('Error loading product details:', err);
      // Keep the error message displayed briefly
      setProductError(err instanceof Error ? err.message : 'Failed to load product details');
      setTimeout(() => setProductError(null), 3000);
    }

    if (editingIndex !== null) {
      const newSamples = [...samples];
      newSamples[editingIndex] = {
        id: samples[editingIndex]?.id || crypto.randomUUID(),
        name: editingSample.name,
        age: editingSample.age,
        proof: editingSample.proof,
        mashbill: editingSample.mashbill,
        distillery: editingSample.distillery,
        description: editingSample.description,
        notes: samples[editingIndex]?.notes || [],
        hints: samples[editingIndex]?.hints || [],
        difficulty: samples[editingIndex]?.difficulty || 1,
        score: samples[editingIndex]?.score || 0,
        challengeQuestions: samples[editingIndex]?.challengeQuestions || [],
        image: samples[editingIndex]?.image || '',
        rating: samples[editingIndex]?.rating || 0,
        type: samples[editingIndex]?.type || '',
        region: samples[editingIndex]?.region || '',
        imageUrl: samples[editingIndex]?.imageUrl || '',
        price: samples[editingIndex]?.price || 0
      };
      onUpdate(newSamples);
    }
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
        <div className="bg-white rounded-lg w-full max-w-3xl max-h-[90vh] overflow-y-auto">
          <div className="p-6 space-y-6">
            {/* Shopify Product Selection */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900">Select from Shopify</h3>
              {isLoadingProducts ? (
                <div className="flex justify-center">
                  <div className="w-6 h-6 border-t-2 rounded-full animate-spin border-amber-600" />
                </div>
              ) : productError ? (
                <div className="text-sm text-red-600">{productError}</div>
              ) : (
                <select
                  title="Select from Shopify"
                  onChange={(e) => handleProductSelect(e.target.value)}
                  className="block w-full border-gray-300 rounded-md shadow-sm focus:border-amber-500 focus:ring-amber-500"
                >
                  <option value="">Select a Product</option>
                  {shopifyProducts.map(product => (
                    <option key={product.id} value={product.id}>
                      {product.title} ({product.vendor})
                    </option>
                  ))}
                </select>
              )}
            </div>

            {/* Sample List */}
            <div className="flex flex-col space-y-4">
              {samples.map((sample, index) => (
                <div key={sample.id || index} className="flex items-center space-x-4">
                  <div className="flex-1">
                    <div className="text-lg font-medium text-gray-900">{sample.name}</div>
                    <div className="text-sm text-gray-500">{sample.distillery}</div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setEditingSample({
                        ...defaultSampleData,
                        name: sample.name,
                        age: sample.age,
                        proof: sample.proof,
                        mashbill: sample.mashbill,
                        distillery: sample.distillery,
                        description: sample.description,
                      });
                      setEditingIndex(index);
                    }}
                    className="text-amber-600"
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const updatedSamples = [...samples];
                      updatedSamples.splice(index, 1);
                      onUpdate(updatedSamples);
                    }}
                    className="text-red-600"
                  >
                    Delete
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </Dialog>
  );
}