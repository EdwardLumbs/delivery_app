// Base interface for database records
export interface BaseRecord {
    id: string;
    created_at: string;
}

export interface MenuItem extends BaseRecord {
    name: string;
    price: number;
    image_url: string;
    description: string;
    calories: number;
    protein: number;
    rating: number;
    category_id: string;
}

export interface Category extends BaseRecord {
    name: string;
    description: string;
}

export interface User extends BaseRecord {
    name: string;
    email: string;
    avatar: string;
    phone_number: string;
    address_1: string;
    address_2: string
}

export interface Customization extends BaseRecord {
    name: string;
    price: number;
    type: string;
}

export interface MenuCustomization extends BaseRecord {
    menu_id: string;
    customization_id: string;
}

export interface CartCustomization {
    id: string;
    name: string;
    price: number;
    type: string;
}

export interface CartItemType {
    id: string; // menu item id
    name: string;
    price: number;
    image_url: string;
    quantity: number;
    customizations?: CartCustomization[];
    isExcluded?: boolean;
}

export interface CartStore {
    items: CartItemType[];
    addItem: (item: Omit<CartItemType, "quantity">) => void;
    removeItem: (id: string, customizations: CartCustomization[]) => void;
    increaseQty: (id: string, customizations: CartCustomization[]) => void;
    decreaseQty: (id: string, customizations: CartCustomization[]) => void;
    toggleExcluded: (id: string, customizations: CartCustomization[]) => void;
    clearCart: () => void;
    getTotalItems: () => number;
    getTotalPrice: () => number;
}

interface TabBarIconProps {
    focused: boolean;
    icon: ImageSourcePropType;
    title: string;
}

interface PaymentInfoStripeProps {
    label: string;
    value: string;
    labelStyle?: string;
    valueStyle?: string;
}

interface CustomButtonProps {
    onPress?: () => void;
    title?: string;
    style?: string;
    leftIcon?: React.ReactNode;
    textStyle?: string;
    isLoading?: boolean;
}

interface CustomHeaderProps {
    title?: string;
}

interface CustomInputProps {
    placeholder?: string;
    value?: string;
    onChangeText?: (text: string) => void;
    label: string;
    secureTextEntry?: boolean;
    keyboardType?: "default" | "email-address" | "numeric" | "phone-pad";
}

interface ProfileFieldProps {
    label: string;
    value: string;
    icon: ImageSourcePropType;
}

interface CreateUserParams {
    email: string;
    password: string;
    name: string;
}

interface SignInParams {
    email: string;
    password: string;
}

interface GetMenuParams {
    category: string;
    query: string;
}